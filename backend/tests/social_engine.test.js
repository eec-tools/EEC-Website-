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
const igBody = `A clear specification makes Indian spice quotes comparable.\n\nSwipe for the four points to put in your next enquiry.\n\nComment SPICE and we will send the checklist.\n\neectrade.com\n\n#Sourcing #Procurement #Spices #SupplyChain #FoodIngredients`;
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
  assert.match(s, /instagram: \{ type: carousel, shouldShareToFeed: true \}/);
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

  // Quiet hours: no reminder at 23:30 IST.
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
