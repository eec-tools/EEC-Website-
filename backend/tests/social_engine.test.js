// End-to-end tests for the EEC Social Engine, using the in-memory store and a fake Buffer.
// Run: JWT_SECRET=test node --test tests/social_engine.test.js
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
const test = require("node:test");
const assert = require("node:assert");

const emailService = require("../src/services/emailService");
const sentMail = [];
emailService.sendMail = async (m) => {
  sentMail.push(m);
  return true;
};

const { createMemoryStore, setStore } = require("../src/social/store");
const { setBuffer, BufferError, lit, createBufferClient } = require("../src/social/buffer");
const time = require("../src/social/time");
const rules = require("../src/social/rules");
const service = require("../src/social/service");
const { tick } = require("../src/social/tick");
const { handleRpc } = require("../src/social/mcp");
const seed = require("../src/social/seedData");

// ---------- fakes ----------
function fakeBuffer() {
  const calls = [];
  const posts = {};
  let n = 0;
  let nextError = null;
  return {
    calls,
    posts,
    failNext(err) {
      nextError = err;
    },
    async createPost(p) {
      calls.push(["create", p]);
      if (nextError) {
        const e = nextError;
        nextError = null;
        throw e;
      }
      const id = `buf_${++n}`;
      posts[id] = { id, status: "scheduled", dueAt: p.dueAt };
      return posts[id];
    },
    async deletePost(id) {
      calls.push(["delete", id]);
      delete posts[id];
      return true;
    },
    async getPost(id) {
      return posts[id] || null;
    },
    async getPostMetrics() {
      return { metrics: {} };
    },
    async organizations() {
      return [{ id: "org1", name: "EEC" }];
    },
    async channels() {
      return [];
    },
  };
}

let store;
let buffer;
let nowMs;
const setNow = (iso) => {
  nowMs = Date.parse(iso);
};

async function fresh({ dryRun = false } = {}) {
  store = createMemoryStore();
  setStore(store);
  buffer = fakeBuffer();
  setBuffer(buffer);
  service.setClock(() => new Date(nowMs));
  sentMail.length = 0;
  for (const [key, value] of seed.config) await store.insert("social_config", { key, value });
  await store.upsert("social_config", { key: "dry_run", value: dryRun });
  await store.upsert("social_config", {
    key: "buffer_channels",
    value: { linkedin_company: "ch_li", instagram: "ch_ig", facebook: "ch_fb", linkedin_shirali: "" },
  });
  for (const [email, name, role] of [
    ["shirali@eectrade.com", "Shirali", "approver"],
    ["harshp.eec@gmail.com", "Harsh", "editor"],
    ["partners@eectrade.com", "Mohita", "viewer"],
  ])
    await store.insert("social_members", { email, name, role, active: true });
}

const approver = { email: "shirali@eectrade.com", name: "Shirali", role: "approver" };
const editor = { email: "harshp.eec@gmail.com", name: "Harsh", role: "editor" };
const viewer = { email: "partners@eectrade.com", name: "Mohita", role: "viewer" };

const goodScores = { stop: 9, useful: 9, true: 10, human: 9, ours: 9, clean: 10 };
const src = [{ title: "IREF", url: "https://example.org/iref", date: "2026-10-20", claim: "prices" }];
const liBody = (topic) =>
  `𝗜𝗻𝗱𝗶𝗮'𝘀 ${topic} market is opening new options for buyers.\n\nCompare landed cost, specifications and supplier capability before you commit.\n\nAt EEC, we help buyers compare offers through our paid Supplier Background Check.\n\nDM "SPICE" or visit https://www.eectrade.com/services.\n\nEEC | Your India Sourcing Office\n\n#IndiaSourcing #Procurement #SupplyChain #FoodIngredients #InternationalTrade`;
const igBody = `A clear specification makes Indian spice quotes comparable.\n\nSwipe for the four points to put in your next enquiry.\n\nMessage us SPICE and we will send the checklist.\n\neectrade.com\n\n#Sourcing #Procurement #Spices #SupplyChain #FoodIngredients`;
const slides = [
  { type: "cover", title: "A clear specification makes spice quotes comparable" },
  { type: "list", title: "Put these in your enquiry", items: ["Grade and origin", "Moisture limits", "Packing", "Shipment window"] },
  { type: "cta", title: "Planning spice sourcing?", cta: "Comment SPICE" },
];

function weekBatch(extra = {}) {
  return {
    week_start: "2026-11-09",
    kind: "weekly",
    plan: { theme: "Opportunities in Indian food sourcing" },
    experiment: "Carousel vs single image on Instagram",
    posts: [
      { channel: "linkedin_company", date: "2026-11-09", kind: "text", pillar: "Food and ingredients", topic: "Spice specifications", body: liBody("spice"), sources: src, scores: goodScores },
      { channel: "linkedin_company", date: "2026-11-11", kind: "text", pillar: "Agricultural commodities", topic: "Rice landed cost", body: liBody("rice"), sources: src, scores: goodScores },
      { channel: "linkedin_company", date: "2026-11-13", kind: "text", pillar: "Home textiles", topic: "Towel GSM checks", body: liBody("towel"), sources: src, scores: goodScores },
      { channel: "instagram", date: "2026-11-10", kind: "carousel", pillar: "Food and ingredients", topic: "Spice specification carousel", body: igBody, slides, alt: ["a", "b", "c"], scores: goodScores },
      { channel: "facebook", date: "2026-11-10", kind: "carousel", pillar: "Food and ingredients", topic: "Spice specification carousel", body: igBody.replace("#FoodIngredients", ""), slides, alt: ["a", "b", "c"], scores: goodScores },
    ],
    ...extra,
  };
}

// ---------- pure helpers ----------
test("time: IST conversion, weekdays, quiet hours", () => {
  assert.equal(time.zonedToUtc("2026-11-09", "09:30", "Asia/Kolkata").toISOString(), "2026-11-09T04:00:00.000Z");
  assert.equal(time.weekdayOf("2026-11-09"), "mon");
  assert.equal(time.mondayOf("2026-11-13"), "2026-11-09");
  assert.equal(time.mondayOf("2026-11-08"), "2026-11-02");
  assert.equal(time.inQuietHours(new Date("2026-11-09T17:00:00Z"), "Asia/Kolkata", "22:00-07:00"), true); // 22:30 IST
  assert.equal(time.inQuietHours(new Date("2026-11-09T05:00:00Z"), "Asia/Kolkata", "22:00-07:00"), false); // 10:30 IST
  const slotsLi = time.cadenceSlots(seed.config.find((c) => c[0] === "cadence")[1], "linkedin_company", "2026-11-09", "Asia/Kolkata");
  assert.deepEqual(slotsLi.map((s) => s.date), ["2026-11-09", "2026-11-11", "2026-11-13"]);
});

test("rules: house style is enforced", () => {
  const ok = { channel: "linkedin_company", kind: "text", body: liBody("spice"), sources: src, scores: goodScores };
  assert.deepEqual(rules.lintPost(ok).filter((l) => l.level === "error"), []);
  const bad = rules.lintPost({ ...ok, body: ok.body.replace("At EEC, we help", "We're Mumbai-based and we've helped") + " — great" });
  const codes = bad.map((l) => l.code);
  for (const c of ["contractions", "dashes", "location"]) assert.ok(codes.includes(c), c);
  assert.ok(rules.lintPost({ ...ok, body: ok.body + " teak furniture" }).some((l) => l.code === "scope"));
  assert.ok(rules.lintPost({ ...ok, scores: { ...goodScores, true: 9 } }).some((l) => l.code === "scores"));
  assert.ok(rules.lintPost({ ...ok, body: ok.body + "\nPrices are almost 10% lower.", sources: [] }).some((l) => l.code === "sources"), "figures need sources");
  assert.ok(!rules.lintPost({ ...ok, sources: [] }).some((l) => l.code === "sources"), "no figures, no source needed");
  assert.ok(rules.lintPost({ channel: "instagram", kind: "image", body: igBody, scores: goodScores }).some((l) => l.code === "media"));
  assert.ok(!rules.lintPost(ok).some((l) => l.code === "contractions"), "possessives are fine");
  const tagged = rules.addUtm("See https://www.eectrade.com/services.", { channel: "linkedin_company", campaign: "wk20261109", content: "P1" });
  assert.equal(tagged, "See https://www.eectrade.com/services?utm_source=linkedin&utm_medium=social&utm_campaign=wk20261109&utm_content=P1.");
  assert.equal(rules.addUtm(tagged, { channel: "linkedin_company", campaign: "x" }), tagged, "never double-tags");
});

test("buffer: GraphQL input is built correctly", () => {
  assert.equal(lit({ a: "x\"y", n: 2, b: true, list: ["u"] }), '{ a: "x\\"y", n: 2, b: true, list: ["u"] }');
  const c = createBufferClient({ apiKey: "k" });
  const input = c.buildCreateInput({ channelId: "ch", channel: "instagram", kind: "carousel", text: "t", media: ["https://x/1.jpg", "https://x/2.jpg"], dueAt: "2026-11-10T13:00:00Z" });
  const s = lit(input);
  assert.match(s, /mode: customScheduled/);
  assert.match(s, /instagram: \{ type: post, shouldShareToFeed: true \}/);
  assert.match(s, /assets: \[\{ image: \{ url: "https:\/\/x\/1.jpg" \} \}/);
  assert.match(lit(c.buildCreateInput({ channelId: "ch", channel: "linkedin_company", kind: "text", text: "t" })), /mode: shareNow/);
});

// ---------- the whole flow ----------
test("submit: all or nothing, cadence, repeats and replacement", async () => {
  setNow("2026-11-06T05:00:00Z");
  await fresh();
  const wrongDay = weekBatch();
  wrongDay.posts[0].date = "2026-11-10"; // Tuesday is not a LinkedIn day
  const bad = await service.submitBatch(wrongDay);
  assert.equal(bad.ok, false);
  assert.equal((await store.list("social_posts")).length, 0, "nothing saved when any post fails");

  const ok = await service.submitBatch(weekBatch());
  assert.equal(ok.ok, true, JSON.stringify(ok));
  const posts = await store.list("social_posts");
  assert.equal(posts.length, 5);
  assert.ok(posts.every((p) => p.status === "pending"));
  const li = posts.find((p) => p.slot_at === "2026-11-09T04:00:00.000Z");
  assert.match(li.body, /utm_source=linkedin&utm_medium=social&utm_campaign=wk20261109/);
  assert.ok(sentMail.some((m) => m.to === "shirali@eectrade.com" && /ready for approval/.test(m.subject)));

  const again = await service.submitBatch(weekBatch());
  assert.equal(again.ok, false, "same slots and ideas are rejected");
  const replaced = await service.submitBatch(weekBatch({ replace_pending: true }));
  assert.equal(replaced.ok, true, JSON.stringify(replaced));
  assert.equal(replaced.replaced.length, 5);
  const all = await store.list("social_posts");
  assert.equal(all.filter((p) => p.status === "dropped").length, 5);
  assert.equal(all.filter((p) => p.status === "pending").length, 5);
});

test("roles: only the approver approves; viewers only comment", async () => {
  setNow("2026-11-06T05:00:00Z");
  await fresh();
  await service.submitBatch(weekBatch());
  const [p] = await store.list("social_posts", { order: ["slot_at", "asc"] });
  await assert.rejects(service.approvePost(editor, p.post_id), /Only approver/);
  await assert.rejects(service.editPost(viewer, p.post_id, { body: "x" }), /Only approver or editor/);
  await assert.rejects(service.dropPost(editor, p.post_id), /Only approver/);
  const c = await service.addComment(viewer, { post_id: p.post_id, body: "Looks good" });
  assert.equal(c.author_email, "partners@eectrade.com");
  assert.equal(await service.memberFor({ email: "stranger@x.com", role: "buyer" }), null);
});

test("approve schedules in Buffer once; edits pull it back", async () => {
  setNow("2026-11-06T05:00:00Z");
  await fresh();
  await service.submitBatch(weekBatch());
  const mon = (await store.list("social_posts", { where: { slot_at: "2026-11-09T04:00:00.000Z" } }))[0];
  const scheduled = await service.approvePost(approver, mon.post_id);
  assert.equal(scheduled.status, "scheduled");
  assert.equal(scheduled.buffer_id, "buf_1");
  const create = buffer.calls.find((c) => c[0] === "create")[1];
  assert.equal(create.channelId, "ch_li");
  assert.equal(new Date(create.dueAt).toISOString(), "2026-11-09T04:00:00.000Z");
  await assert.rejects(service.approvePost(approver, mon.post_id), /not waiting for approval/);

  const edited = await service.editPost(editor, mon.post_id, { body: mon.body.replace("new options", "practical options"), note: "softer" });
  assert.equal(edited.status, "pending");
  assert.equal(edited.version, 2);
  assert.ok(buffer.calls.some((c) => c[0] === "delete" && c[1] === "buf_1"), "removed from Buffer");
  const versions = await store.list("social_post_versions", { where: { post_id: mon.post_id } });
  assert.deepEqual(versions.map((v) => v.change_kind), ["created", "approver_edit"]);

  // Instagram carousel goes out with rendered slide URLs.
  const ig = (await store.list("social_posts", { where: { channel: "instagram" } }))[0];
  await service.approvePost(approver, ig.post_id);
  const igCreate = buffer.calls.filter((c) => c[0] === "create").pop()[1];
  assert.equal(igCreate.media.length, 3);
  assert.match(igCreate.media[0], /\/api\/social\/media\/P-20261110-ig-[0-9a-f]{4}\/1\/1\.jpg$/);
});

test("send back, revise through the connector, approve", async () => {
  setNow("2026-11-06T05:00:00Z");
  await fresh();
  await service.submitBatch(weekBatch());
  const wed = (await store.list("social_posts", { where: { slot_at: "2026-11-11T04:00:00.000Z" } }))[0];
  await service.requestChanges(approver, wed.post_id, "Lead with the opportunity, not the price");

  const q = await handleRpc({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "get_work_queue", arguments: {} } });
  const queue = JSON.parse(q.result.content[0].text);
  assert.equal(queue.sent_back.length, 1);
  assert.equal(queue.sent_back[0].change_requests[0].request, "Lead with the opportunity, not the price");

  const stale = await service.submitRevision({ post_id: wed.post_id, from_version: 5, body: wed.body, note: "x" });
  assert.equal(stale.ok, false);
  const r = await service.submitRevision({ post_id: wed.post_id, from_version: 1, body: wed.body.replace("is opening", "keeps opening"), note: "Shirali asked to lead with the opportunity" });
  assert.equal(r.ok, true, JSON.stringify(r));
  const post = await store.get("social_posts", wed.post_id);
  assert.equal(post.status, "pending");
  assert.equal(post.version, 2);
  const open = await store.list("social_comments", { where: { post_id: wed.post_id, resolved: false } });
  assert.equal(open.length, 0, "change request resolved");
  const bad = await service.submitRevision({ post_id: wed.post_id, from_version: 2, body: post.body + " We're great", note: "x" });
  assert.equal(bad.ok, false, "revisions must pass the rules too");
});

test("never post twice: unclear Buffer answers are not retried", async () => {
  setNow("2026-11-06T05:00:00Z");
  await fresh();
  await service.submitBatch(weekBatch());
  const [a, b] = await store.list("social_posts", { where: { channel: "linkedin_company" }, order: ["slot_at", "asc"] });

  buffer.failNext(new BufferError("timeout", { kind: "network", ambiguous: true }));
  const fa = await service.approvePost(approver, a.post_id);
  assert.equal(fa.status, "failed");
  assert.match(fa.error, /Check the Buffer queue/);
  await tick();
  assert.equal((await store.get("social_posts", a.post_id)).status, "failed", "tick does not retry an unclear send");

  buffer.failNext(new BufferError("Buffer refused the post: image too small"));
  const fb = await service.approvePost(approver, b.post_id);
  assert.equal(fb.status, "approved");
  assert.match(fb.error, /image too small/);
  const s = await tick();
  assert.ok(s.scheduled.includes(b.post_id), "a clear refusal is retried by the clock");
  assert.equal((await store.get("social_posts", b.post_id)).status, "scheduled");
});

test("clock: posted, missed, late approval and reminders", async () => {
  setNow("2026-11-06T05:00:00Z");
  await fresh();
  await service.submitBatch(weekBatch());
  const [mon, wed] = await store.list("social_posts", { where: { channel: "linkedin_company" }, order: ["slot_at", "asc"] });
  await service.approvePost(approver, mon.post_id);

  // Reminder: Sunday 10:00 IST, Monday's slot within 48h... the Wednesday post is waiting.
  setNow("2026-11-09T04:30:00Z"); // Mon 10:00 IST
  sentMail.length = 0;
  buffer.posts.buf_1.status = "sent";
  buffer.posts.buf_1.externalLink = "https://www.linkedin.com/feed/update/urn:li:share:1";
  const s1 = await tick();
  assert.deepEqual(s1.posted, [mon.post_id]);
  const posted = await store.get("social_posts", mon.post_id);
  assert.equal(posted.external_url, "https://www.linkedin.com/feed/update/urn:li:share:1");
  assert.ok(s1.reminded >= 1);
  assert.ok(sentMail.some((m) => /waiting for your approval/.test(m.subject)));

  // 23:30 IST: no reminder (more than 3 hours after the 18:30 one), and never the same one twice.
  setNow("2026-11-09T18:00:00Z");
  sentMail.length = 0;
  const s2 = await tick();
  assert.equal(s2.reminded, 0);

  // Wednesday approved 2 hours late: goes out now.
  setNow("2026-11-11T06:00:00Z"); // 11:30 IST, slot was 09:30
  const late = await service.approvePost(approver, wed.post_id);
  assert.equal(late.status, "scheduled");
  assert.equal(buffer.calls.filter((c) => c[0] === "create").pop()[1].dueAt, null, "shared now");

  // Friday never approved: missed after the 6-hour window.
  setNow("2026-11-13T11:00:00Z"); // slot 04:00Z + 7h
  const s3 = await tick();
  const fri = (await store.list("social_posts", { where: { slot_at: "2026-11-13T04:00:00.000Z" } }))[0];
  assert.equal(fri.status, "missed");
  assert.ok(s3.missed.includes(fri.post_id));
  await assert.rejects(service.approvePost(approver, fri.post_id), /not waiting for approval/);
});

test("kill switch pulls queued posts and resumes them", async () => {
  setNow("2026-11-06T05:00:00Z");
  await fresh();
  await service.submitBatch(weekBatch());
  const [mon, wed] = await store.list("social_posts", { where: { channel: "linkedin_company" }, order: ["slot_at", "asc"] });
  await service.approvePost(approver, mon.post_id);
  await assert.rejects(service.setPublishing(editor, true), /Only approver/);
  const paused = await service.setPublishing(editor, false);
  assert.deepEqual(paused.pulled, [mon.post_id]);
  assert.equal((await store.get("social_posts", mon.post_id)).status, "approved");
  const w = await service.approvePost(approver, wed.post_id);
  assert.equal(w.status, "approved", "approving while paused does not send");
  await assert.rejects(service.postNow(approver, wed.post_id), /paused/);
  const resumed = await service.setPublishing(approver, true);
  assert.equal(resumed.scheduled.length, 2);
  assert.equal((await store.get("social_posts", wed.post_id)).status, "scheduled");
});

test("dry run never calls Buffer", async () => {
  setNow("2026-11-06T05:00:00Z");
  await fresh({ dryRun: true });
  await service.submitBatch(weekBatch());
  const [mon] = await store.list("social_posts", { where: { channel: "linkedin_company" }, order: ["slot_at", "asc"] });
  const p = await service.approvePost(approver, mon.post_id);
  assert.equal(p.status, "scheduled");
  assert.match(p.buffer_id, /^dry-run-/);
  setNow("2026-11-09T05:00:00Z");
  await tick();
  assert.equal((await store.get("social_posts", mon.post_id)).status, "dropped");
  assert.equal(buffer.calls.length, 0);
});

test("connector: no approve or publish tools; context lists open slots", async () => {
  setNow("2026-11-06T05:00:00Z");
  await fresh();
  const init = await handleRpc({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18" } });
  assert.equal(init.result.serverInfo.name, "eec-social-engine");
  assert.equal(await handleRpc({ jsonrpc: "2.0", method: "notifications/initialized" }), null);
  const list = await handleRpc({ jsonrpc: "2.0", id: 2, method: "tools/list" });
  const names = list.result.tools.map((t) => t.name);
  assert.ok(names.includes("submit_batch") && names.includes("submit_revision"));
  assert.ok(!names.some((n) => /approve|publish|schedule|post_now/.test(n)), names.join(","));
  const ctx = JSON.parse((await handleRpc({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "get_context", arguments: {} } })).result.content[0].text);
  assert.equal(ctx.next_week_start, "2026-11-09");
  assert.equal(ctx.open_slots_next_week.filter((s) => s.channel === "linkedin_company").length, 3);
  const check = JSON.parse((await handleRpc({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "check_posts", arguments: weekBatch() } })).result.content[0].text);
  assert.equal(check.ok, true, JSON.stringify(check));
  assert.equal((await store.list("social_posts")).length, 0, "check_posts saves nothing");
});

test("start_run: says exactly which jobs are due, and nothing twice", async () => {
  const call = async (name, args = {}) => JSON.parse((await handleRpc({ jsonrpc: "2.0", id: 9, method: "tools/call", params: { name, arguments: args } })).result.content[0].text);
  const jobs = async () => (await call("start_run")).jobs || [];

  // Tuesday 05:00 IST: too early for research, nothing else due.
  setNow("2026-11-02T23:30:00Z");
  await fresh();
  let r = await call("start_run");
  assert.deepEqual(r.jobs || [], []);
  assert.match(r.note, /Nothing is due/);

  // Tuesday 07:12 IST: research is due until finish_job is called.
  setNow("2026-11-03T01:42:00Z");
  assert.deepEqual((await jobs()).map((j) => j.job), ["research"]);
  await call("finish_job", { job: "research", summary: "3 findings" });
  assert.deepEqual(await jobs(), []);

  // Friday 07:12 IST: research and the plan for next week.
  setNow("2026-11-06T01:42:00Z");
  let due = await jobs();
  assert.deepEqual(due.map((j) => j.job), ["research", "plan_week"]);
  assert.equal(due[1].week_start, "2026-11-09");
  assert.ok(due[1].open_slots >= 3);
  await call("finish_job", { job: "research" });
  await service.submitBatch(weekBatch());
  assert.deepEqual(await jobs(), [], "plan is done once the batch exists");

  // A post sent back makes revise due first.
  const [p] = await store.list("social_posts", { order: ["slot_at", "asc"] });
  await service.requestChanges(approver, p.post_id, "Make the opening shorter");
  due = await jobs();
  assert.equal(due[0].job, "revise");
  assert.equal(due[0].sent_back, 1);

  // Sunday 18:12 IST: the weekly report until it is emailed.
  setNow("2026-11-08T12:42:00Z");
  due = await jobs();
  const rep = due.find((j) => j.job === "report");
  assert.ok(rep, JSON.stringify(due));
  assert.equal(rep.from, "2026-11-01T18:30:00.000Z");
  await call("send_notice", { kind: "report", subject: "Weekly report", html: "<p>ok</p>" });
  assert.ok(!(await jobs()).some((j) => j.job === "report"));

  // Monday: no report catch-up because Sunday's went out.
  setNow("2026-11-09T01:42:00Z");
  assert.ok(!(await jobs()).some((j) => j.job === "report"));

  // Lean views: revise context carries no posts or research.
  const ctx = await call("get_context", { view: "revise" });
  assert.ok(ctx.today && !ctx.recent_posts && !ctx.research && !ctx.open_slots_next_week);
});

test("lint: platform rules (hashtag cap, hook length, engagement bait, links)", () => {
  const ig = (body) => rules.lintPost({ channel: "instagram", kind: "image", body, slides: [{ type: "cover", title: "t" }], alt: ["a"] });
  const codes = (l) => l.map((x) => `${x.level}:${x.code}`);
  assert.ok(codes(ig("Short hook.\n\n#A #B #C #D #E #F")).includes("error:hashtags"), "Instagram caps hashtags at 5");
  assert.ok(codes(ig("Short hook.\n\nComment RICE and we will send it.\n\n#A #B #C")).includes("error:engagement_bait"));
  assert.ok(!codes(ig("Short hook.\n\nMessage us RICE and we will send it.\n\n#A #B #C")).some((c) => c.endsWith("engagement_bait")));
  assert.ok(codes(ig(`${"x".repeat(130)}\n\n#A #B #C`)).includes("warn:hook_length"));
  const fb = rules.lintPost({ channel: "facebook", kind: "text", body: "Hook.\n\nSee https://www.eectrade.com/services\n\n#Sourcing" });
  assert.ok(codes(fb).includes("warn:link_in_body"));
  const li = rules.lintPost({ channel: "linkedin_company", kind: "text", body: "Hook.\n\nAgree?\n\nEEC | Your India Sourcing Office\n\n#A #B #C" });
  assert.ok(codes(li).includes("warn:engagement_bait"));
});

test("buffer input: Instagram carousel is a multi-image post; first comment only when enabled", async () => {
  const c = createBufferClient({ apiKey: "x" });
  const ig = c.buildCreateInput({ channelId: "c", channel: "instagram", text: "t", kind: "carousel", media: ["https://a/1.jpg", "https://a/2.jpg"] });
  assert.match(lit(ig), /type: post/);
  assert.equal(ig.assets.length, 2);
  setNow("2026-11-06T05:00:00Z");
  await fresh();
  const batch = weekBatch();
  batch.posts.find((p) => p.channel === "facebook").first_comment = "More at https://www.eectrade.com/services";
  await service.submitBatch(batch);
  const fb = (await store.list("social_posts", { where: { channel: "facebook" } }))[0];
  await service.approvePost(approver, fb.post_id);
  const sent = buffer.calls.find((x) => x[0] === "create" && x[1].channel === "facebook")[1];
  assert.equal(sent.firstComment, undefined, "free Buffer plan: no first comment");
});

test("sync: posted on time, deleted in Buffer, post now picked up at once", async () => {
  const { quickSync } = require("../src/social/tick");
  setNow("2026-11-06T05:00:00Z");
  await fresh();
  await service.submitBatch(weekBatch());
  const li = await store.list("social_posts", { where: { channel: "linkedin_company" }, order: ["slot_at", "asc"] });
  const a = await service.approvePost(approver, li[0].post_id);
  const b = await service.approvePost(approver, li[1].post_id);
  // Monday 09:31 IST: the first has been sent by Buffer, the second was deleted in Buffer.
  setNow("2026-11-09T04:01:30Z");
  buffer.posts[a.buffer_id].status = "sent";
  buffer.posts[a.buffer_id].externalLink = "https://www.linkedin.com/feed/update/x";
  delete buffer.posts[b.buffer_id];
  setNow("2026-11-11T04:01:30Z");
  await quickSync({ minGapMs: 0 });
  assert.equal((await store.get("social_posts", a.post_id)).status, "posted");
  assert.equal((await store.get("social_posts", b.post_id)).status, "dropped");
  // Post now: the post's time becomes now, so the next sync sees it.
  setNow("2026-11-11T05:00:00Z");
  const c = await service.postNow(approver, li[2].post_id);
  assert.ok(Date.parse((await store.get("social_posts", c.post_id)).slot_at) <= Date.parse("2026-11-11T05:00:00Z"));
  buffer.posts[c.buffer_id].status = "sent";
  setNow("2026-11-11T05:01:30Z");
  await quickSync({ minGapMs: 0 });
  assert.equal((await store.get("social_posts", c.post_id)).status, "posted");
});

test("fact checker: recheck before posting, verdicts saved, approver told, unverifiable blocks", async () => {
  const call = async (name, args = {}) => JSON.parse((await handleRpc({ jsonrpc: "2.0", id: 9, method: "tools/call", params: { name, arguments: args } })).result.content[0].text);
  setNow("2026-11-06T05:00:00Z");
  await fresh();
  await service.submitBatch(weekBatch());
  const [mon] = await store.list("social_posts", { where: { channel: "linkedin_company" }, order: ["slot_at", "asc"] });
  await service.approvePost(approver, mon.post_id);

  // Sunday 20:00 IST: Monday's post goes out within 36 hours and has sources, so it is due a recheck.
  setNow("2026-11-08T14:30:00Z");
  const due = (await call("start_run")).jobs.find((j) => j.job === "recheck");
  assert.ok(due && due.post_ids.includes(mon.post_id), JSON.stringify(due));

  sentMail.length = 0;
  const r = await call("record_fact_check", {
    post_id: mon.post_id,
    checks: [
      { text: "Indian rice is about 10% more competitive", verdict: "confirmed", source: "https://example.org/iref", date: "2026-10-20" },
      { text: "Duty falls to zero on 1 January", verdict: "corrected", corrected_text: "Duty falls to zero on 1 April", source: "https://example.org/gov" },
    ],
  });
  assert.equal(r.problems, 1);
  const p = await store.get("social_posts", mon.post_id);
  assert.equal(p.status, "scheduled", "the post itself is untouched");
  assert.equal(p.claims.length, 2);
  const notes = await store.list("social_comments", { where: { post_id: mon.post_id } });
  assert.ok(notes.some((c) => c.author_name === "Fact checker" && c.processed_at), "comment saved, not fed back to the learner");
  assert.ok(sentMail.some((m) => /check a fact/.test(m.subject)));
  assert.ok(!(await call("start_run")).jobs.some((j) => j.job === "recheck"), "checked recently: not due again");

  // An unverifiable fact is a blocking error in the post check.
  const lint = rules.lintPost({ ...p, claims: [{ text: "x", verdict: "unverifiable" }] });
  assert.ok(lint.some((l) => l.level === "error" && l.code === "fact_unverified"));
});

// ---------- Studio feedback (November 2026) ----------
const { settle } = require("../src/social/defer");
const studioData = require("../src/social/studioData");
const { buildPdf } = require("../src/social/pdf");
const rpc = async (name, args = {}) => JSON.parse((await handleRpc({ jsonrpc: "2.0", id: 9, method: "tools/call", params: { name, arguments: args } })).result.content[0].text);

test("request a change: only that post is held, pulled from Buffer, changed, then approved by hand", async () => {
  setNow("2026-11-06T05:00:00Z");
  await fresh();
  await service.submitBatch(weekBatch());
  const [mon, wed] = await store.list("social_posts", { where: { channel: "linkedin_company" }, order: ["slot_at", "asc"] });
  await service.approvePost(approver, mon.post_id);
  await service.approvePost(approver, wed.post_id);
  const before = await store.get("social_posts", mon.post_id);
  assert.equal(before.status, "scheduled");

  await assert.rejects(service.requestChange(viewer, mon.post_id, { note: "shorter caption" }), /Only approver or editor/);
  const r = await service.requestChange(editor, mon.post_id, { note: "Shorter caption, warmer ending" });
  assert.equal(r.held.length, 1, "only this post");
  assert.ok(Date.parse(r.ready_by) > Date.parse("2026-11-06T05:00:00Z"));
  assert.ok(buffer.calls.some((c) => c[0] === "delete" && c[1] === before.buffer_id), "pulled out of Buffer");
  const held = await store.get("social_posts", mon.post_id);
  assert.equal(held.status, "changes_requested");
  assert.equal(held.change_request.state, "open");
  assert.equal((await store.get("social_posts", wed.post_id)).status, "scheduled", "everything else posts as normal");
  await assert.rejects(service.approvePost(approver, mon.post_id), /A change was requested/);

  // The writer picks it up at the next run.
  const queue = await rpc("get_work_queue");
  assert.equal(queue.sent_back[0].request.note, "Shorter caption, warmer ending");
  const rev = await rpc("submit_revision", { post_id: mon.post_id, from_version: 1, body: liBody("spice").replace("Compare landed cost, specifications and supplier capability before you commit.\n\n", ""), scores: goodScores, note: "Shortened the caption" });
  assert.equal(rev.ok, true, JSON.stringify(rev));
  const done = await store.get("social_posts", mon.post_id);
  assert.equal(done.status, "pending");
  assert.equal(done.change_request.state, "done", "Changed on your request. Check it, then approve it.");

  // Nothing posts until the approver taps Approve this post.
  const ok = await service.approvePost(approver, mon.post_id);
  assert.equal(ok.status, "scheduled");
  assert.equal((await store.get("social_posts", mon.post_id)).change_request, null);
});

test("request a change on shared slides holds the whole day; failure, request again, post it as it was, cancel", async () => {
  setNow("2026-11-06T05:00:00Z");
  await fresh();
  await service.submitBatch(weekBatch());
  const ig = (await store.list("social_posts", { where: { channel: "instagram" } }))[0];
  const fb = (await store.list("social_posts", { where: { channel: "facebook" } }))[0];
  await service.approvePost(approver, fb.post_id);

  const r = await service.requestChange(editor, ig.post_id, { note: "Fewer slides", visuals: true });
  assert.deepEqual(r.held.map((h) => h.channel).sort(), ["facebook", "instagram"], "both posts sharing the slides wait");
  assert.equal((await store.get("social_posts", fb.post_id)).status, "changes_requested");

  // The writer cannot do it.
  await rpc("fail_change", { post_id: ig.post_id, reason: "Needs photos the library does not have yet" });
  const failed = await store.get("social_posts", ig.post_id);
  assert.equal(failed.change_request.state, "failed");
  assert.equal((await store.get("social_posts", fb.post_id)).change_request.state, "failed", "same request, same result");
  assert.ok(!(await rpc("start_run")).jobs.some((j) => j.job === "revise"), "a failed request is not retried on its own");
  assert.ok(sentMail.some((m) => /could not be made/.test(m.subject)));

  await service.retryChange(editor, ig.post_id, { note: "Fewer slides, keep the cover" });
  assert.equal((await store.get("social_posts", ig.post_id)).change_request.state, "open");
  assert.ok((await rpc("start_run")).jobs.some((j) => j.job === "revise"));

  // Post it as it was (approver only), and cancel on the other.
  await rpc("fail_change", { post_id: ig.post_id, reason: "Still no photos" });
  const kept = await service.approvePost(approver, ig.post_id, { keep_original: true });
  assert.equal(kept.status, "scheduled");
  await service.cancelChange(editor, fb.post_id);
  const fbNow = await store.get("social_posts", fb.post_id);
  assert.equal(fbNow.status, "pending", "back to waiting for approval");
  assert.equal(fbNow.change_request, null);
});

test("a held post not approved in time is marked missed, never posted", async () => {
  setNow("2026-11-06T05:00:00Z");
  await fresh();
  await service.submitBatch(weekBatch());
  const [mon] = await store.list("social_posts", { where: { channel: "linkedin_company" }, order: ["slot_at", "asc"] });
  await service.requestChange(editor, mon.post_id, { note: "Different example" });
  setNow("2026-11-09T11:00:00Z"); // 09:30 IST slot + 7 hours
  await tick();
  assert.equal((await store.get("social_posts", mon.post_id)).status, "missed");
});

test("approve answers at once and Buffer follows in the background", async () => {
  setNow("2026-11-06T05:00:00Z");
  await fresh();
  await service.submitBatch(weekBatch());
  const [mon] = await store.list("social_posts", { where: { channel: "linkedin_company" }, order: ["slot_at", "asc"] });
  const r = await service.approvePost(approver, mon.post_id, { background: true });
  assert.equal(r.status, "approved");
  assert.equal(r.sending, true);
  await settle();
  assert.equal((await store.get("social_posts", mon.post_id)).status, "scheduled");
});

test("reminders: one digest at 09:30 and one at 18:30, each once", async () => {
  setNow("2026-11-06T05:00:00Z");
  await fresh();
  await service.submitBatch(weekBatch());
  const digests = () => sentMail.filter((m) => /waiting for your approval/.test(m.subject)).length;
  setNow("2026-11-07T04:05:00Z"); // 09:35 IST
  sentMail.length = 0;
  await tick();
  await tick();
  assert.equal(digests(), 1, "once for the morning");
  setNow("2026-11-07T08:00:00Z"); // 13:30 IST: nothing
  await tick();
  assert.equal(digests(), 1);
  setNow("2026-11-07T13:10:00Z"); // 18:40 IST
  await tick();
  assert.equal(digests(), 2, "evening digest");
  assert.match(sentMail.find((m) => /waiting for your approval/.test(m.subject)).subject, /first goes out in/);
});

test("LinkedIn document posts: PDF built from the slides and sent as a document", async () => {
  setNow("2026-11-06T05:00:00Z");
  await fresh();
  const doc = {
    channel: "linkedin_company",
    date: "2026-11-09",
    kind: "document",
    format: "document",
    segment: "importer_distributor",
    pillar: "Food and ingredients",
    topic: "Five details that make spice quotes comparable",
    body: "Spice quotes are only comparable when they quote the same specification.\n\nThe five details are in the document.\n\nMessage the EEC page with SPICE or email partners@eectrade.com.\n\nEEC | Your India Sourcing Office\n\n#IndiaSourcing #Spices #Procurement",
    slides: [
      { type: "cover", title: "Five details that make spice quotes comparable" },
      { type: "compare", title: "What FOB includes and landed cost adds", columns: ["FOB", "Landed"], rows: [{ label: "Product cost", a: true, b: true }, { label: "Ocean freight", a: false, b: true }] },
      { type: "question", title: "Can a small store order a mixed container?", body: "Often, yes. Ask each supplier for minimum orders per product." },
      { type: "cta", title: "Sourcing spices from India?", cta: "Message us SPICE" },
    ],
    scores: goodScores,
  };
  const res = await service.submitBatch({ week_start: "2026-11-09", kind: "fast_lane", posts: [doc] });
  assert.equal(res.ok, true, JSON.stringify(res));
  const p = await store.get("social_posts", res.posts[0].post_id);
  assert.equal(p.format, "document");
  assert.equal(p.segment, "importer_distributor");
  assert.deepEqual(service.mediaUrls(p), [service.documentUrl(p)]);
  await service.approvePost(approver, p.post_id);
  const sent = buffer.calls.find((c) => c[0] === "create")[1];
  assert.equal(sent.document.url, service.documentUrl(p));
  assert.equal(sent.document.thumbnailUrl, service.slideUrl(p, 1));
  assert.deepEqual(sent.media, []);
  const input = createBufferClient({ apiKey: "x" }).buildCreateInput({ channelId: "c", channel: "linkedin_company", text: "t", kind: "document", document: sent.document });
  assert.equal(input.assets[0].document.title, "Five details that make spice quotes comparable");

  // The renderer draws the new slide types and the PDF wraps them.
  const { renderSlide } = require("../src/social/slides");
  const pages = [];
  for (let i = 0; i < doc.slides.length; i++) pages.push(await renderSlide(doc.slides, i));
  const pdf = buildPdf(pages, { title: doc.topic });
  assert.equal(pdf.slice(0, 5).toString(), "%PDF-");
  assert.match(pdf.slice(-6).toString(), /%%EOF/);
  // Documents are LinkedIn only.
  assert.ok(rules.lintPost({ ...p, channel: "instagram" }).some((l) => l.code === "document_channel"));
});

test("tone checks: bold Unicode, hype, exclamation marks", () => {
  const codes = rules.lintPost({ channel: "linkedin_company", kind: "text", body: liBody("spice").replace("before you commit.", "before you commit. Unlock savings now!") }).map((l) => l.code);
  for (const c of ["unicode_bold", "hype", "exclamation"]) assert.ok(codes.includes(c), c);
});

test("competitors, enquiries, engagers and the run log", async () => {
  setNow("2026-11-06T05:00:00Z");
  await fresh();
  await assert.rejects(studioData.saveCompetitor(viewer, "companies", { name: "QIMA" }), /Only approver or editor/);
  await studioData.saveCompetitor(editor, "companies", { name: "QIMA", linkedin_url: "https://www.linkedin.com/company/qima" });
  await studioData.saveCompetitor(editor, "people", { name: "A. Sourcing Head", company: "Example Ltd" });
  const post = await studioData.saveCompetitor(editor, "posts", { author: "QIMA", author_type: "company", format: "Document", body: "Eight audit findings..." });
  let all = await studioData.listCompetitors();
  assert.equal(all.companies.length, 1);
  assert.equal(all.people.length, 1);

  // A posted EEC post with keyword SHRIMP, and an engager list pasted from the notifications.
  await service.submitBatch(weekBatch());
  const [mon] = await store.list("social_posts", { where: { channel: "linkedin_company" }, order: ["slot_at", "asc"] });
  await store.update("social_posts", { post_id: mon.post_id }, { status: "posted", body: `${mon.body}\nMessage the EEC page with SHRIMP.` });
  const enq = await studioData.saveEnquiry(editor, { channel: "linkedin", keyword: "shrimp", company: "Example Foods LLC", country: "UAE", audience: "buyer" });
  assert.equal(enq.post_id, mon.post_id, "keyword links the enquiry to its post");
  const people = await studioData.addEngagers(editor, { post_id: mon.post_id, text: "Asha Rao - Procurement Manager at Example Foods\nRavi K | Export Manager, Spice Mills\n" });
  assert.equal(people.length, 2);
  assert.equal(people[1].headline, "Export Manager, Spice Mills");

  // The notes job: the engine notes the competitor post and sorts the people.
  const run = await rpc("start_run");
  const notes = run.jobs.find((j) => j.job === "notes");
  assert.ok(notes && notes.competitor_posts === 1 && notes.engagers === 2, JSON.stringify(run));
  const q = await rpc("get_notes_queue");
  assert.equal(q.competitor_posts[0].id, post.id);
  await rpc("save_competitor_note", { id: post.id, why_it_works: "One concrete finding per page, ends with a checklist." });
  await rpc("classify_engagers", { items: [{ id: people[0].id, type: "buyer", role: "Procurement Manager", company: "Example Foods", follow_up: true }, { id: people[1].id, type: "supplier" }] });
  await rpc("finish_job", { job: "notes", summary: "1 note, 2 people sorted", sources: [{ title: "QIMA post", url: "https://www.linkedin.com/posts/x", used_for: "competitor note" }, { url: "not a url" }] });
  assert.ok(!(await rpc("start_run")).jobs.some((j) => j.job === "notes"));

  const activity = await studioData.listActivity();
  assert.equal(activity[0].job, "notes");
  assert.equal(activity[0].sources.length, 1, "only real links are kept");

  const extra = await studioData.insightsExtra(await store.list("social_posts"));
  assert.equal(extra.per_post[mon.post_id].enquiries, 1);
  assert.equal(extra.per_post[mon.post_id].buyer, 1);
  assert.equal(extra.by_format["not set"].enquiries, 1);
  all = await studioData.listCompetitors();
  assert.ok(all.posts[0].why_it_works);
  const ctx = await rpc("get_context", { view: "plan" });
  assert.equal(ctx.competitor_posts.length, 1);
  assert.ok(ctx.formats.document);
});

test("database update not run yet: reads stay working and writes say what to run", async () => {
  const { isMissingSchema, MESSAGE } = require("../src/social/dbCheck");
  const { errorHandler } = require("../src/middleware/errorHandler");
  const data = require("../src/social/studioData");
  const store = createMemoryStore();
  setStore(store);
  // Simulate Supabase without the new tables.
  const missing = new Set(["social_competitor_people", "social_competitor_posts", "social_enquiries", "social_engagers"]);
  const real = store.list.bind(store);
  store.list = async (table, opts) => {
    if (missing.has(table)) {
      const e = new Error(`Could not find the table 'public.${table}' in the schema cache`);
      e.code = "PGRST205";
      throw e;
    }
    return real(table, opts);
  };
  await store.insert("social_competitors", { name: "QIMA", active: true });
  const c = await data.listCompetitors();
  assert.equal(c.companies.length, 1);
  assert.deepEqual(c.people, []);
  assert.equal(c.db_update_needed, true);
  const extra = await data.insightsExtra([{ post_id: "P1", status: "posted", format: "checklist", metrics: { impressions: 100 } }]);
  assert.equal(extra.db_update_needed, true);
  assert.equal(extra.by_format.checklist.posts, 1);
  assert.deepEqual(await data.listEnquiries(), []);

  const err = new Error('relation "social_engagers" does not exist');
  err.code = "42P01";
  assert.ok(isMissingSchema(err));
  assert.ok(!isMissingSchema(new Error("Buffer is down")));
  let status, body;
  const res = { status: (s) => ((status = s), res), json: (b) => ((body = b), res) };
  errorHandler(err, { method: "POST", originalUrl: "/api/studio/engagers" }, res, () => {});
  assert.equal(status, 503);
  assert.equal(body.detail, MESSAGE);
});
