// Core actions of the EEC Social Engine.
//
// Safety rules enforced here (not in the UI):
//  - Nothing is sent to Buffer unless the single approver approved that post.
//  - Approving one post or batch never approves another.
//  - Every send attempt is written down before Buffer is called, and an unclear answer
//    from Buffer is never retried automatically, so a post cannot go out twice.
//  - A post more than late_window_hours past its time is marked missed, never sent.
//  - The writing agent can create and revise drafts only. It cannot approve or publish.

const { z } = require("zod");
const { randomUUID } = require("crypto");
const HttpError = require("../utils/httpError");
const logger = require("../utils/logger");
const { getStore } = require("./store");
const { getSettings, setSetting, audit } = require("./settings");
const { getBuffer, BufferError } = require("./buffer");
const { lintPost, hasErrors, addUtm, ideaKey } = require("./rules");
const { zonedToUtc, weekdayOf, addDays, mondayOf, localParts } = require("./time");
const notify = require("./notify");
const { defer } = require("./defer");
const { FORMATS, FORMAT_KEYS, SEGMENT_KEYS, CURRENT_FORMATS } = require("./formats");
const photos = require("./photos");
const { TYPES: V2_TYPES, ICON_KEYS: V2_ICONS } = require("./slidesV2");

const LIVE = ["pending", "changes_requested", "approved", "scheduled", "posting", "posted"];
const EDITABLE = ["pending", "changes_requested", "approved", "scheduled", "failed"];
const CHANNELS = ["linkedin_shirali", "linkedin_company", "instagram", "facebook"];

let clock = () => new Date();
function setClock(fn) {
  clock = fn;
}
const now = () => clock();
const hex = (n) => randomUUID().replace(/-/g, "").slice(0, n);
const isDryRunId = (id) => typeof id === "string" && id.startsWith("dry-run-");

function publicBase() {
  return (process.env.SOCIAL_PUBLIC_BASE_URL || "https://eec-website-backend.vercel.app").replace(/\/$/, "");
}

function slideUrl(post, n) {
  return `${publicBase()}/api/social/media/${post.post_id}/${post.version}/${n}.jpg`;
}
function documentUrl(post) {
  return `${publicBase()}/api/social/media/${post.post_id}/${post.version}/document.pdf`;
}

// Slides become image URLs served (and cached) by GET /api/social/media/...
function mediaUrls(post) {
  if (post.kind === "document" && (post.slides || []).length) return [documentUrl(post)];
  if ((post.slides || []).length) {
    return post.slides.map((_, i) => `${publicBase()}/api/social/media/${post.post_id}/${post.version}/${i + 1}.jpg`);
  }
  return (post.media || []).map((m) => (typeof m === "string" ? m : m.url)).filter(Boolean);
}

// Draws every slide (and document) once in the background, so it is cached before Buffer asks for it.
function warmMedia(posts) {
  if (!process.env.VERCEL || typeof fetch !== "function") return;
  const urls = posts.flatMap((p) => ((p.slides || []).length ? [...p.slides.map((_, i) => slideUrl(p, i + 1)), ...(p.kind === "document" ? [documentUrl(p)] : [])] : []));
  if (!urls.length) return;
  defer(async () => {
    for (const u of urls) await fetch(u).then((r) => r.arrayBuffer()).catch(() => null);
  }, "warm slide images");
}

// ---------------- roles ----------------
async function memberFor(user) {
  if (!user) return null;
  const m = await getStore().get("social_members", String(user.email || "").toLowerCase());
  if (m && m.active) return m;
  if (user.role === "admin") return { email: user.email, name: user.name || user.email, role: "editor", active: true, site_admin: true };
  return null;
}
function requireRole(member, roles) {
  if (!member) throw new HttpError(403, "You do not have access to the Social Studio.");
  if (!roles.includes(member.role)) throw new HttpError(403, `Only ${roles.join(" or ")} can do this.`);
}

// ---------------- validation ----------------
const compareCell = z.union([z.boolean(), z.string().max(40)]).optional();
const panelSchema = z.object({ title: z.string().max(60).optional(), text: z.string().max(140).optional(), items: z.array(z.string().max(60)).max(4).optional() });
const slideSchema = z.object({
  type: z.enum(["cover", "point", "list", "stat", "cta", "compare", "question", ...V2_TYPES]),
  accent: z.string().max(120).optional(),
  photo: z.string().max(1000).optional(),
  step: z.string().max(20).optional(),
  name: z.string().max(40).optional(),
  icon: z.enum(V2_ICONS).optional(),
  table: z.array(z.object({ label: z.string().max(40), value: z.string().max(60) })).max(4).optional(),
  big: z.object({ value: z.string().max(10), caption: z.string().max(60).optional() }).optional(),
  swatches: z.array(z.object({ color: z.string().regex(/^#[0-9a-fA-F]{6}$/), label: z.string().max(24), note: z.string().max(24).optional() })).max(3).optional(),
  good: panelSchema.optional(),
  bad: panelSchema.optional(),
  ask_label: z.string().max(40).optional(),
  ask: z.string().max(160).optional(),
  rule_label: z.string().max(40).optional(),
  rule: z.string().max(160).optional(),
  offer: z.string().max(80).optional(),
  keyword: z.string().regex(/^[A-Z0-9]{2,16}$/, "keyword: 2 to 16 capital letters or digits").optional(),
  got_label: z.string().max(40).optional(),
  got: z.array(z.string().max(80)).max(3).optional(),
  why: z.string().max(200).optional(),
  intro: z.string().max(120).optional(),
  close: z.string().max(160).optional(),
  badge: z.string().max(40).optional(),
  meaning: z.string().max(200).optional(),
  columns: z.array(z.string().max(30)).max(2).optional(),
  rows: z.array(z.object({ label: z.string().max(120), a: compareCell, b: compareCell })).max(7).optional(),
  kicker: z.string().max(60).optional(),
  number: z.union([z.string(), z.number()]).optional(),
  title: z.string().max(140).optional(),
  body: z.string().max(400).optional(),
  items: z.array(z.string().max(160)).max(5).optional(),
  value: z.string().max(16).optional(),
  label: z.string().max(140).optional(),
  source: z.string().max(120).optional(),
  cta: z.string().max(60).optional(),
});
// A checkable fact in a post, with the fact checker's verdict.
const claimSchema = z.object({
  text: z.string().max(500),
  source: z.string().max(500).optional(),
  date: z.string().max(40).optional(),
  verdict: z.enum(["confirmed", "corrected", "unverifiable"]).optional(),
  note: z.string().max(500).optional(),
  checked_at: z.string().max(40).optional(),
});
const sourceSchema = z.object({ title: z.string(), url: z.string(), date: z.string().optional(), claim: z.string().optional() });
const postInput = z.object({
  channel: z.enum(CHANNELS),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  kind: z.enum(["text", "image", "carousel", "reel", "document"]),
  format: z.enum(FORMAT_KEYS).optional(),
  segment: z.enum(SEGMENT_KEYS).optional(),
  audience: z.enum(["buyer", "supplier", "both"]).optional(),
  market: z.string().max(80).optional(),
  pillar: z.string().max(80),
  series: z.string().max(80).optional(),
  topic: z.string().min(5).max(300),
  idea_key: z.string().max(80).optional(),
  hook: z.string().max(400).optional(),
  body: z.string().min(1).max(5000),
  link: z.string().max(400).optional(),
  first_comment: z.string().max(1000).optional(),
  slides: z.array(slideSchema).max(10).optional(),
  media: z.array(z.string().url()).max(10).optional(),
  alt: z.array(z.string().max(500)).max(10).optional(),
  sources: z.array(sourceSchema).max(20).optional(),
  claims: z.array(claimSchema).max(20).optional(),
  verify_flags: z.string().max(2000).optional(),
  scores: z.record(z.string(), z.number()).optional(),
  tests: z.string().max(300).optional(),
});
const batchInput = z.object({
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  // rolling: the next 7 days from week_start (any date); filled whenever fewer than 3 days are ready.
  kind: z.enum(["weekly", "fast_lane", "rolling"]).default("weekly"),
  plan: z.record(z.string(), z.any()).default({}),
  experiment: z.string().max(500).optional(),
  qa_summary: z.record(z.string(), z.any()).default({}),
  replace_pending: z.boolean().default(false),
  posts: z.array(postInput).min(1).max(30),
});

function parse(schema, input) {
  const r = schema.safeParse(input);
  if (!r.success) {
    throw new HttpError(422, r.error.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join("; "));
  }
  return r.data;
}

// ---------------- batches from the writing agent ----------------
function toRow(p, { postId, batchId, slotAt, campaign }) {
  return {
    post_id: postId,
    batch_id: batchId,
    channel: p.channel,
    slot_at: slotAt,
    kind: p.kind,
    // Only written when set, so posts still save before the November 2026 migration has run.
    ...(p.format ? { format: p.format } : {}),
    ...(p.segment ? { segment: p.segment } : {}),
    audience: p.audience || null,
    market: p.market || null,
    pillar: p.pillar,
    series: p.series || null,
    topic: p.topic,
    idea_key: p.idea_key ? ideaKey(p.idea_key) : ideaKey(p.topic),
    hook: p.hook || null,
    body: addUtm(p.body, { channel: p.channel, campaign, content: postId }),
    link: p.link ? addUtm(p.link, { channel: p.channel, campaign, content: postId }) : null,
    first_comment: p.first_comment ? addUtm(p.first_comment, { channel: p.channel, campaign, content: postId }) : null,
    slides: p.slides || [],
    media: p.media || [],
    alt: p.alt || [],
    sources: p.sources || [],
    claims: p.claims || [],
    verify_flags: p.verify_flags || null,
    scores: p.scores || {},
    tests: p.tests || null,
    status: "pending",
    version: 1,
    tries: 0,
    reminder_count: 0,
    metrics: {},
  };
}

// Validates a set of posts against the rules, the cadence, open slots and the never-repeat
// list. Used both for check_posts (dry) and submit_batch.
async function evaluatePosts(input, { replaceIds = new Set() } = {}) {
  const settings = await getSettings();
  const tz = settings.timezone;
  const store = getStore();
  const t = now();
  const yearAgo = new Date(t.getTime() - 365 * 86400000).toISOString();
  const existing = (await store.list("social_posts", { where: { slot_at: { gte: yearAgo } } })).filter(
    (p) => !replaceIds.has(p.post_id)
  );
  const live = existing.filter((p) => LIVE.includes(p.status));
  const campaign = `wk${input.week_start.replace(/-/g, "")}`;
  const weekEnd = addDays(input.week_start, 7);

  const results = [];
  const seenSlots = new Set();
  const perChannelCount = {};
  for (const [i, p] of input.posts.entries()) {
    const problems = [];
    const cad = settings.cadence[p.channel] || {};
    const time = p.time || cad.time;
    let slotAt = null;
    try {
      slotAt = zonedToUtc(p.date, time, tz).toISOString();
    } catch (e) {
      problems.push({ level: "error", code: "time", message: e.message });
    }
    if (input.kind === "weekly" || input.kind === "rolling") {
      if (!(cad.days || []).length) problems.push({ level: "error", code: "channel_off", message: `${p.channel} has no posting days in the cadence.` });
      else if (!cad.days.includes(weekdayOf(p.date)))
        problems.push({ level: "error", code: "cadence", message: `${p.channel} posts on ${cad.days.join(", ")}; ${p.date} is a ${weekdayOf(p.date)}.` });
      if (p.date < input.week_start || p.date >= weekEnd)
        problems.push({ level: "error", code: "week", message: `${p.date} is outside the 7 days starting ${input.week_start}.` });
    }
    if (slotAt) {
      if (Date.parse(slotAt) < t.getTime() + 30 * 60000) problems.push({ level: "error", code: "past", message: `The time ${p.date} ${time} has passed or is less than 30 minutes away.` });
      const k = `${p.channel}|${slotAt}`;
      if (seenSlots.has(k)) problems.push({ level: "error", code: "duplicate_slot", message: "Two posts in this submission share a channel and time." });
      seenSlots.add(k);
      if (live.some((x) => x.channel === p.channel && Date.parse(x.slot_at) === Date.parse(slotAt)))
        problems.push({ level: "error", code: "slot_taken", message: `${p.channel} already has a post at ${p.date} ${time}.` });
    }
    if (input.kind !== "fast_lane" && (!p.format || (FORMATS[p.format] && FORMATS[p.format].retired)))
      problems.push({ level: "error", code: "format", message: `Use one of the current formats: ${CURRENT_FORMATS.join(", ")}.` });
    const key = p.idea_key ? ideaKey(p.idea_key) : ideaKey(p.topic);
    const repeat = live.find((x) => x.channel === p.channel && x.idea_key === key);
    if (repeat) problems.push({ level: "error", code: "repeat", message: `Same idea as ${repeat.post_id} (${repeat.status}) on ${p.channel}.` });

    if (input.kind === "weekly" || input.kind === "rolling") {
      // The cap counts per calendar week (Monday to Sunday) of the post's own date.
      const wk = mondayOf(p.date);
      const ck = `${p.channel}|${wk}`;
      perChannelCount[ck] = (perChannelCount[ck] || 0) + 1;
      const wFrom = zonedToUtc(wk, "00:00", tz).getTime();
      const wTo = zonedToUtc(addDays(wk, 7), "00:00", tz).getTime();
      const already = live.filter((x) => x.channel === p.channel && Date.parse(x.slot_at) >= wFrom && Date.parse(x.slot_at) < wTo).length;
      const cap = cad.max_per_week ?? 7;
      if (already + perChannelCount[ck] > cap)
        problems.push({ level: "error", code: "weekly_cap", message: `${p.channel} is capped at ${cap} posts a week.` });
    }

    for (const [k, sl] of (p.slides || []).entries())
      if (sl.photo && !photos.isRef(sl.photo) && !/^https:\/\/\S+$/i.test(sl.photo)) problems.push({ level: "error", code: "photo", message: `Slide ${k + 1}: photo must be an https link to the generated image.` });
    const row = toRow(p, { postId: "check", batchId: "check", slotAt, campaign });
    problems.push(...lintPost(row));
    results.push({ index: i, channel: p.channel, date: p.date, time, slot_at: slotAt, problems });
  }
  return { results, campaign, settings };
}

async function checkPosts(raw) {
  const input = parse(batchInput, raw);
  const { results } = await evaluatePosts(input);
  return {
    ok: results.every((r) => !hasErrors(r.problems)),
    posts: results.map((r) => ({ ...r, errors: r.problems.filter((x) => x.level === "error"), warnings: r.problems.filter((x) => x.level === "warn"), problems: undefined })),
  };
}

async function submitBatch(raw, actor = "claude") {
  const input = parse(batchInput, raw);
  const store = getStore();
  const settings = await getSettings();
  const tz = settings.timezone;
  if (mondayOf(input.week_start) !== input.week_start && input.kind === "weekly") {
    throw new HttpError(422, `week_start must be a Monday; ${input.week_start} is a ${weekdayOf(input.week_start)}.`);
  }

  // Posts this submission replaces: still waiting for approval, same week, same channels.
  let replaceIds = new Set();
  if (input.replace_pending) {
    const from = zonedToUtc(input.week_start, "00:00", tz).toISOString();
    const to = zonedToUtc(addDays(input.week_start, 7), "00:00", tz).toISOString();
    const channels = [...new Set(input.posts.map((p) => p.channel))];
    const waiting = await store.list("social_posts", {
      where: { slot_at: { gte: from, lt: to }, status: { in: ["pending", "changes_requested"] }, channel: { in: channels } },
    });
    replaceIds = new Set(waiting.map((p) => p.post_id));
  }

  const { results, campaign } = await evaluatePosts(input, { replaceIds });
  if (results.some((r) => hasErrors(r.problems))) {
    return {
      ok: false,
      message: "Nothing was saved. Fix the errors and submit the whole batch again.",
      posts: results.map((r) => ({ index: r.index, channel: r.channel, date: r.date, errors: r.problems.filter((x) => x.level === "error") })),
    };
  }

  // Generated photos are downloaded and kept now, so the post never depends on the outside link.
  try {
    for (const p of input.posts) if ((p.slides || []).some((x) => x.photo)) p.slides = await photos.ingestSlides(p.slides, actor);
  } catch (e) {
    return { ok: false, message: `Nothing was saved. ${e.message}` };
  }

  for (const id of replaceIds) {
    await store.update("social_posts", { post_id: id, status: { in: ["pending", "changes_requested"] } }, {
      status: "dropped",
      error: "Replaced by a newer batch from the writer",
      updated_at: now().toISOString(),
    });
  }

  const batchId = `B-${input.week_start.replace(/-/g, "")}-${hex(4)}`;
  await store.insert("social_batches", {
    batch_id: batchId,
    week_start: input.week_start,
    kind: input.kind,
    status: "pending",
    plan: input.plan,
    experiment: input.experiment || null,
    qa_summary: input.qa_summary,
    created_by: actor,
    created_at: now().toISOString(),
    updated_at: now().toISOString(),
  });

  const saved = [];
  for (const [i, p] of input.posts.entries()) {
    const postId = `P-${p.date.replace(/-/g, "")}-${{ linkedin_shirali: "li", linkedin_company: "lc", instagram: "ig", facebook: "fb" }[p.channel]}-${hex(4)}`;
    const row = toRow(p, { postId, batchId, slotAt: results[i].slot_at, campaign });
    row.lint = lintPost(row);
    row.created_at = row.updated_at = now().toISOString();
    await store.insert("social_posts", row);
    await store.insert("social_post_versions", {
      post_id: postId,
      version: 1,
      body: row.body,
      slides: row.slides,
      change_kind: "created",
      changed_by: actor,
      created_at: now().toISOString(),
    });
    saved.push(row);
  }
  await audit(actor, "batch.submitted", batchId, { posts: saved.length, replaced: [...replaceIds] });
  warmMedia(saved);

  const approvers = await notify.approverEmails();
  await notify.send(
    approvers,
    `EEC Social: ${saved.length} posts ready for approval (week of ${input.week_start})`,
    notify.wrap(
      "New posts are ready for your approval",
      `<p>Open the Studio page, review each post as it will look, and approve. Nothing goes out until you approve it.</p>${notify.postTable(saved, settings.timezone)}<p><a href="${notify.studioUrl("?tab=pending")}">Review and approve</a></p>`
    )
  );

  return {
    ok: true,
    batch_id: batchId,
    replaced: [...replaceIds],
    posts: saved.map((p) => ({ post_id: p.post_id, channel: p.channel, slot_at: p.slot_at, warnings: p.lint.filter((x) => x.level === "warn") })),
  };
}

// ---------------- approval and publishing ----------------
async function refreshBatchStatus(batchId) {
  const store = getStore();
  const batch = await store.get("social_batches", batchId);
  if (!batch || batch.status === "deleted") return;
  const posts = (await store.list("social_posts", { where: { batch_id: batchId } })).filter((p) => p.status !== "dropped");
  const done = posts.filter((p) => ["approved", "scheduled", "posting", "posted"].includes(p.status)).length;
  const open = posts.filter((p) => ["pending", "changes_requested"].includes(p.status)).length;
  const status = !posts.length ? "closed" : open === 0 && done === 0 ? "closed" : open === 0 ? "approved" : done ? "partly_approved" : "pending";
  if (status !== batch.status) await store.update("social_batches", { batch_id: batchId }, { status, updated_at: now().toISOString() });
}

async function alert(subject, html) {
  const settings = await getSettings();
  return notify.send(settings.notify_email, `EEC Social: ${subject}`, notify.wrap(subject, html));
}

// Sends an approved post to Buffer (scheduled for its time, or now when shareNow is true
// or when it is late but inside the late window).
async function schedulePost(postId, { shareNow = false } = {}) {
  const store = getStore();
  const settings = await getSettings();
  let post = await store.get("social_posts", postId);
  if (!post || post.status !== "approved") return post;

  if (settings.dry_run) {
    const [p] = await store.update("social_posts", { post_id: postId, status: "approved" }, {
      status: "scheduled",
      buffer_id: `dry-run-${postId}`,
      error: null,
      updated_at: now().toISOString(),
    });
    await audit("system", "post.scheduled_dry_run", postId);
    return p || post;
  }
  if (!settings.publishing_enabled) return post; // paused: stays approved, resumes later

  const channelId = (settings.buffer_channels || {})[post.channel];
  if (!channelId) {
    const [p] = await store.update("social_posts", { post_id: postId, status: "approved" }, {
      error: `No Buffer channel is connected for ${post.channel}. Map it on the Studio Settings tab.`,
      updated_at: now().toISOString(),
    });
    return p || post;
  }

  const t = now();
  const slot = new Date(post.slot_at);
  const lateMs = (Number(settings.late_window_hours) || 6) * 3600000;
  if (!shareNow && slot.getTime() < t.getTime() - lateMs) {
    const [p] = await store.update("social_posts", { post_id: postId, status: "approved" }, {
      status: "missed",
      error: `Approved more than ${settings.late_window_hours} hours after its time, so it was not sent.`,
      updated_at: t.toISOString(),
    });
    await audit("system", "post.missed", postId, { reason: "late approval" });
    return p || post;
  }
  const dueAt = !shareNow && slot.getTime() > t.getTime() + 2 * 60000 ? slot : null;

  // Write the attempt down first.
  const [claimed] = await store.update("social_posts", { post_id: postId, status: "approved", buffer_id: { is: null } }, {
    status: "posting",
    tries: (post.tries || 0) + 1,
    updated_at: t.toISOString(),
  });
  if (!claimed) return post;
  post = claimed;

  try {
    const created = await getBuffer().createPost({
      channelId,
      channel: post.channel,
      text: post.body,
      kind: post.kind,
      media: post.kind === "document" ? [] : mediaUrls(post),
      document: post.kind === "document" ? { url: documentUrl(post), title: (post.topic || "EEC").slice(0, 100), thumbnailUrl: slideUrl(post, 1) } : undefined,
      // First comments need a paid Buffer plan; only sent when buffer_first_comment is switched on.
      firstComment: (await getSettings()).buffer_first_comment === true ? post.first_comment : undefined,
      dueAt,
    });
    const [p] = await store.update("social_posts", { post_id: postId, status: "posting" }, {
      status: "scheduled",
      buffer_id: created.id,
      error: null,
      updated_at: now().toISOString(),
    });
    await audit("system", dueAt ? "post.scheduled" : "post.sent_now", postId, { buffer_id: created.id, due_at: dueAt });
    return p;
  } catch (e) {
    const ambiguous = e instanceof BufferError && e.ambiguous;
    const giveUp = ambiguous || post.tries >= 3;
    const message = ambiguous
      ? `Buffer did not answer clearly (${e.message}). Check the Buffer queue for this post before trying again. It was not retried automatically, so it cannot go out twice.`
      : e.message;
    const [p] = await store.update("social_posts", { post_id: postId, status: "posting" }, {
      status: giveUp ? "failed" : "approved",
      error: message,
      updated_at: now().toISOString(),
    });
    await audit("system", "post.send_failed", postId, { message, try: post.tries, gave_up: giveUp });
    if (giveUp) await alert(`a post could not be scheduled`, `<p>${notify.esc(post.topic)} (${notify.esc(post.channel)})</p><p>${notify.esc(message)}</p>`);
    logger.warning(`social: schedule ${postId} failed: ${message}`);
    return p;
  }
}

async function unschedule(post, actor, reason) {
  if (post.buffer_id && !isDryRunId(post.buffer_id) && post.status === "scheduled") {
    try {
      await getBuffer().deletePost(post.buffer_id);
    } catch (e) {
      const denied = /not allowed|permission/i.test(e.message);
      let gone = false;
      if (denied) {
        try {
          gone = !(await getBuffer().getPost(post.buffer_id));
        } catch (e2) {
          gone = false;
        }
      }
      if (gone) {
        await audit(actor, "post.unscheduled", post.post_id, { reason, buffer_id: post.buffer_id, note: "already deleted in Buffer" });
        return;
      }
      throw new HttpError(
        502,
        denied
          ? `Buffer would not let the engine remove this post (the Buffer account behind the API key has no delete permission on this channel). It is still scheduled and will go out at its time. To stop or change it, delete it in Buffer (publish.buffer.com), then try again here. Nothing was changed.`
          : `Could not remove the post from Buffer: ${e.message}. Nothing was changed.`
      );
    }
  }
  await audit(actor, "post.unscheduled", post.post_id, { reason, buffer_id: post.buffer_id });
}

function assertNotSent(post) {
  if (["posting", "posted"].includes(post.status)) throw new HttpError(409, "This post has already been sent.");
  if (post.status === "scheduled" && !isDryRunId(post.buffer_id) && Date.parse(post.slot_at) <= now().getTime()) {
    throw new HttpError(409, "This post is due now or already sent by Buffer. Check the Posted tab.");
  }
}

async function getPostOr404(postId) {
  const post = await getStore().get("social_posts", postId);
  if (!post) throw new HttpError(404, "Post not found");
  return post;
}

// background: answer as soon as the approval is saved; Buffer is called after the response
// (Approve felt slow because it waited for Buffer to fetch every slide).
// keep_original: approve the post as it is and drop an open change request ("Post it as it was").
async function approvePost(member, postId, { override_reason, background = false, keep_original = false } = {}) {
  requireRole(member, ["approver"]);
  const store = getStore();
  const post = await getPostOr404(postId);
  if (!["pending", "changes_requested"].includes(post.status)) throw new HttpError(409, `This post is ${post.status}, not waiting for approval.`);
  const cr = post.change_request;
  if (cr && ["open", "failed"].includes(cr.state) && !keep_original) {
    throw new HttpError(409, "A change was requested for this post. Wait for it, cancel the request, or choose Post it as it was.");
  }
  const lint = lintPost(post);
  if (hasErrors(lint) && !(override_reason && override_reason.trim().length >= 5)) {
    throw new HttpError(409, `This post breaks a rule: ${lint.filter((l) => l.level === "error").map((l) => l.message).join(" ")} Edit it, or approve with a reason.`);
  }
  const [p] = await store.update("social_posts", { post_id: postId, status: { in: ["pending", "changes_requested"] }, version: post.version }, {
    status: "approved",
    approved_by: member.email,
    approved_at: now().toISOString(),
    lint,
    error: null,
    ...(cr ? { change_request: null } : {}),
    updated_at: now().toISOString(),
  });
  if (!p) throw new HttpError(409, "The post changed while you were looking at it. Refresh and check it again.");
  await audit(member.email, "post.approved", postId, { version: post.version, override_reason: override_reason || null, kept_original: Boolean(keep_original && cr) });
  if (cr) await store.update("social_comments", { post_id: postId, kind: "change_request", resolved: false }, { resolved: true });
  if (background) {
    defer(async () => {
      await schedulePost(postId);
      await refreshBatchStatus(post.batch_id);
    }, `schedule ${postId}`);
    return { ...p, sending: true };
  }
  const result = await schedulePost(postId);
  await refreshBatchStatus(post.batch_id);
  return result;
}

async function approveBatch(member, batchId, opts = {}) {
  requireRole(member, ["approver"]);
  const posts = await getStore().list("social_posts", { where: { batch_id: batchId, status: { in: ["pending", "changes_requested"] } }, order: ["slot_at", "asc"] });
  const approved = [];
  const skipped = [];
  for (const p of posts) {
    try {
      approved.push(await approvePost(member, p.post_id, { ...opts, keep_original: false }));
    } catch (e) {
      skipped.push({ post_id: p.post_id, reason: e.message });
    }
  }
  await audit(member.email, "batch.approved", batchId, { approved: approved.length, skipped });
  return { approved: approved.map((p) => p && p.post_id), skipped };
}

async function unapprovePost(member, postId) {
  requireRole(member, ["approver"]);
  const post = await getPostOr404(postId);
  if (!["approved", "scheduled"].includes(post.status)) throw new HttpError(409, `Only approved posts can be unapproved; this one is ${post.status}.`);
  assertNotSent(post);
  await unschedule(post, member.email, "unapproved");
  const [p] = await getStore().update("social_posts", { post_id: postId, status: { in: ["approved", "scheduled"] } }, {
    status: "pending",
    buffer_id: null,
    approved_by: null,
    approved_at: null,
    updated_at: now().toISOString(),
  });
  await audit(member.email, "post.unapproved", postId);
  await refreshBatchStatus(post.batch_id);
  return p;
}

const editSchema = z.object({
  body: z.string().min(1).max(5000).optional(),
  slides: z.array(slideSchema).max(10).optional(),
  alt: z.array(z.string().max(500)).max(10).optional(),
  first_comment: z.string().max(1000).nullable().optional(),
  media: z.array(z.string().url()).max(10).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  note: z.string().max(500).optional(),
});

async function editPost(member, postId, raw) {
  requireRole(member, ["approver", "editor"]);
  const patchIn = parse(editSchema, raw);
  const store = getStore();
  const settings = await getSettings();
  const post = await getPostOr404(postId);
  if (!EDITABLE.includes(post.status)) throw new HttpError(409, `A ${post.status} post cannot be edited.`);
  assertNotSent(post);

  const patch = { updated_at: now().toISOString() };
  const textChanged = patchIn.body !== undefined && patchIn.body !== post.body;
  const slidesChanged = patchIn.slides !== undefined && JSON.stringify(patchIn.slides) !== JSON.stringify(post.slides);
  const utm = async (text) => {
    const batch = await store.get("social_batches", post.batch_id);
    return addUtm(text, { channel: post.channel, campaign: `wk${String(batch ? batch.week_start : "").replace(/-/g, "")}`, content: postId });
  };
  if (patchIn.body !== undefined) patch.body = await utm(patchIn.body);
  if (patchIn.slides !== undefined) patch.slides = patchIn.slides;
  if (patchIn.alt !== undefined) patch.alt = patchIn.alt;
  if (patchIn.first_comment !== undefined) patch.first_comment = patchIn.first_comment ? await utm(patchIn.first_comment) : patchIn.first_comment;
  if (patchIn.media !== undefined) patch.media = patchIn.media;

  if (patchIn.date || patchIn.time) {
    const lp = localParts(new Date(post.slot_at), settings.timezone);
    const slotAt = zonedToUtc(patchIn.date || lp.date, patchIn.time || lp.time, settings.timezone).toISOString();
    if (Date.parse(slotAt) < now().getTime() + 5 * 60000) throw new HttpError(422, "Pick a time at least 5 minutes from now, or use Post now.");
    const clash = await store.list("social_posts", { where: { channel: post.channel, slot_at: slotAt, status: { in: LIVE } } });
    if (clash.some((c) => c.post_id !== postId)) throw new HttpError(409, `${post.channel} already has a post at that time.`);
    patch.slot_at = slotAt;
  }

  const wasApproved = ["approved", "scheduled"].includes(post.status);
  if (wasApproved) {
    await unschedule(post, member.email, "edited after approval");
    Object.assign(patch, { status: "pending", buffer_id: null, approved_by: null, approved_at: null });
  }
  if (post.status === "failed") Object.assign(patch, { status: "pending", error: null, tries: 0 });
  if (textChanged || slidesChanged) patch.version = post.version + 1;

  const next = { ...post, ...patch };
  patch.lint = lintPost(next);
  const [saved] = await store.update("social_posts", { post_id: postId, version: post.version }, patch);
  if (!saved) throw new HttpError(409, "The post changed while you were editing it. Refresh and try again.");

  if (textChanged || slidesChanged) {
    await store.insert("social_post_versions", {
      post_id: postId,
      version: patch.version,
      body: saved.body,
      slides: saved.slides,
      change_kind: "approver_edit",
      changed_by: member.email,
      note: patchIn.note || null,
      created_at: now().toISOString(),
    });
  }
  await audit(member.email, "post.edited", postId, {
    fields: Object.keys(patchIn),
    from_version: post.version,
    to_version: saved.version,
    returned_to_pending: wasApproved,
  });
  if (slidesChanged) warmMedia([saved]);
  await refreshBatchStatus(post.batch_id);
  return saved;
}

async function dropPost(member, postId, { reason } = {}) {
  requireRole(member, ["approver"]);
  const post = await getPostOr404(postId);
  if (["posted", "dropped", "missed"].includes(post.status)) throw new HttpError(409, `This post is already ${post.status}.`);
  assertNotSent(post);
  await unschedule(post, member.email, "dropped");
  const [p] = await getStore().update("social_posts", { post_id: postId, status: post.status }, {
    status: "dropped",
    buffer_id: null,
    error: reason ? `Dropped: ${reason}` : "Dropped by the approver",
    updated_at: now().toISOString(),
  });
  await audit(member.email, "post.dropped", postId, { reason: reason || null });
  await refreshBatchStatus(post.batch_id);
  return p;
}

// The owner's reset: every post not yet published is dropped (and taken out of Buffer). Published posts stay.
async function removeUnpublished({ confirm, reason } = {}, actor = "claude") {
  if (confirm !== "REMOVE ALL UNPUBLISHED POSTS") throw new HttpError(422, 'confirm must be exactly "REMOVE ALL UNPUBLISHED POSTS".');
  const store = getStore();
  const posts = await store.list("social_posts", { where: { status: { in: ["pending", "changes_requested", "approved", "scheduled", "failed"] } } });
  const done = [];
  const skipped = [];
  for (const post of posts) {
    if (post.sending || post.status === "posting") {
      skipped.push({ post_id: post.post_id, why: "being sent right now" });
      continue;
    }
    await unschedule(post, actor, "removed with all unpublished posts").catch(() => null);
    await store.update("social_posts", { post_id: post.post_id }, { status: "dropped", buffer_id: null, error: `Removed: ${String(reason || "").slice(0, 200)}`, updated_at: now().toISOString() });
    done.push(post.post_id);
  }
  for (const b of [...new Set(posts.map((p) => p.batch_id))]) await refreshBatchStatus(b).catch(() => null);
  await audit(actor, "posts.removed_unpublished", null, { count: done.length, reason: reason || null });
  return { ok: true, removed: done.length, skipped };
}

// ---------------- Request a change ----------------
// When the next scheduled run will have the change ready: the next run time plus a margin.
function changeReadyBy(settings, from = now()) {
  const tz = settings.timezone;
  const runs = (Array.isArray(settings.engine_runs) && settings.engine_runs.length ? settings.engine_runs : ["10:00", "12:00", "14:00"]).slice().sort();
  const today = localParts(from, tz).date;
  for (let d = 0; d < 3; d++) {
    const date = addDays(today, d);
    for (const t of runs) {
      const at = zonedToUtc(date, t, tz);
      if (at.getTime() > from.getTime() + 60000) return new Date(at.getTime() + 25 * 60000);
    }
  }
  return new Date(from.getTime() + 24 * 3600000);
}

// The posts a request holds: just this one, or with slides/images, every post that day sharing them.
async function changeTargets(post, visuals) {
  if (!visuals) return [post];
  const settings = await getSettings();
  const day = localParts(new Date(post.slot_at), settings.timezone).date;
  const store = getStore();
  const sameDay = await store.list("social_posts", {
    where: { status: { in: EDITABLE }, slot_at: { gte: zonedToUtc(day, "00:00", settings.timezone).toISOString(), lt: zonedToUtc(addDays(day, 1), "00:00", settings.timezone).toISOString() } },
  });
  const shares = (p) => p.post_id === post.post_id || (p.idea_key && p.idea_key === post.idea_key && (p.slides || []).length && (post.slides || []).length);
  return sameDay.filter(shares);
}

const changeSchema = z.object({
  note: z.string().trim().min(3, "Say what should change.").max(1000),
  visuals: z.boolean().default(false),
  post_ids: z.array(z.string()).max(12).optional(),
});

// Holds the post(s), pulls them out of Buffer, and queues the request for the next scheduled run.
// Everything else keeps posting as normal.
async function requestChange(member, postId, raw) {
  requireRole(member, ["approver", "editor"]);
  const input = parse(changeSchema, typeof raw === "string" ? { note: raw } : raw || {});
  const store = getStore();
  const settings = await getSettings();
  const first = await getPostOr404(postId);
  let targets = await changeTargets(first, input.visuals);
  if (input.post_ids && input.post_ids.length) {
    for (const id of input.post_ids) if (!targets.some((t) => t.post_id === id)) targets.push(await getPostOr404(id));
  }
  for (const t of targets) {
    if (!EDITABLE.includes(t.status)) throw new HttpError(409, `${t.channel} post on ${notify.whenLocal(t.slot_at, settings.timezone)} is ${t.status}; it cannot be changed.`);
    assertNotSent(t);
  }
  const readyBy = changeReadyBy(settings);
  const group = `R-${hex(8)}`;
  const held = [];
  for (const t of targets) {
    if (["approved", "scheduled"].includes(t.status)) await unschedule(t, member.email, "change requested");
    const request = {
      id: group,
      note: input.note,
      visuals: input.visuals,
      by: member.email,
      by_name: member.name,
      at: now().toISOString(),
      ready_by: readyBy.toISOString(),
      state: "open",
      was: t.status,
      posts: targets.map((x) => x.post_id),
    };
    const [p] = await store.update("social_posts", { post_id: t.post_id, version: t.version }, {
      status: "changes_requested",
      buffer_id: null,
      approved_by: null,
      approved_at: null,
      error: null,
      change_request: request,
      updated_at: now().toISOString(),
    });
    if (!p) throw new HttpError(409, "The post changed. Refresh and try again.");
    await store.insert("social_comments", {
      comment_id: `C-${hex(10)}`,
      post_id: t.post_id,
      batch_id: t.batch_id,
      author_email: member.email,
      author_name: member.name,
      kind: "change_request",
      body: input.note,
      resolved: false,
      created_at: now().toISOString(),
    });
    await audit(member.email, "post.change_requested", t.post_id, { note: input.note, visuals: input.visuals, group, ready_by: request.ready_by });
    await refreshBatchStatus(t.batch_id);
    held.push(p);
  }
  const lateMs = (Number(settings.late_window_hours) || 6) * 3600000;
  return {
    ok: true,
    ready_by: readyBy.toISOString(),
    held: held.map((p) => ({ post_id: p.post_id, channel: p.channel, slot_at: p.slot_at, after_time: Date.parse(p.slot_at) < readyBy.getTime(), skip_after: new Date(Date.parse(p.slot_at) + lateMs).toISOString() })),
  };
}

async function postsInRequest(post) {
  const ids = (post.change_request && post.change_request.posts) || [post.post_id];
  const out = [];
  for (const id of ids) {
    const p = await getStore().get("social_posts", id);
    if (p && p.change_request && post.change_request && p.change_request.id === post.change_request.id) out.push(p);
  }
  return out.length ? out : [post];
}

// Cancel request: the post goes back to waiting for approval as it was (it needs approving again).
async function cancelChange(member, postId) {
  requireRole(member, ["approver", "editor"]);
  const post = await getPostOr404(postId);
  if (!post.change_request || post.status !== "changes_requested") throw new HttpError(409, "There is no open change request on this post.");
  const store = getStore();
  for (const p of await postsInRequest(post)) {
    if (p.status !== "changes_requested") continue;
    await store.update("social_posts", { post_id: p.post_id, status: "changes_requested" }, { status: "pending", change_request: null, error: null, updated_at: now().toISOString() });
    await store.update("social_comments", { post_id: p.post_id, kind: "change_request", resolved: false }, { resolved: true });
    await audit(member.email, "post.change_cancelled", p.post_id, { group: post.change_request.id });
    await refreshBatchStatus(p.batch_id);
  }
  return getPostOr404(postId);
}

// Request again, after a change could not be made.
async function retryChange(member, postId, raw = {}) {
  requireRole(member, ["approver", "editor"]);
  const post = await getPostOr404(postId);
  const cr = post.change_request;
  if (!cr || cr.state !== "failed") throw new HttpError(409, "Only a failed change can be requested again.");
  const settings = await getSettings();
  const readyBy = changeReadyBy(settings);
  const note = raw.note && String(raw.note).trim().length >= 3 ? String(raw.note).trim().slice(0, 1000) : cr.note;
  for (const p of await postsInRequest(post)) {
    await getStore().update("social_posts", { post_id: p.post_id }, {
      change_request: { ...p.change_request, note, state: "open", error: null, ready_by: readyBy.toISOString(), at: now().toISOString() },
      updated_at: now().toISOString(),
    });
    await audit(member.email, "post.change_requested_again", p.post_id, { note });
  }
  return { ok: true, ready_by: readyBy.toISOString() };
}

// The writer could not make the change (called by the scheduled task).
async function failChange(postId, reason, actor = "claude") {
  const post = await getPostOr404(postId);
  if (!post.change_request || post.status !== "changes_requested") return { ok: false, message: "This post has no open change request." };
  const settings = await getSettings();
  for (const p of await postsInRequest(post)) {
    await getStore().update("social_posts", { post_id: p.post_id }, {
      change_request: { ...p.change_request, state: "failed", error: String(reason || "No reason given").slice(0, 600), failed_at: now().toISOString() },
      updated_at: now().toISOString(),
    });
    await audit(actor, "post.change_failed", p.post_id, { reason });
  }
  await notify.send(
    [...new Set([...(await notify.approverEmails()), post.change_request.by].filter(Boolean))],
    `EEC Social: a requested change could not be made (${notify.whenLocal(post.slot_at, settings.timezone)})`,
    notify.wrap("A requested change could not be made", `<p><b>Request:</b> ${notify.esc(post.change_request.note)}</p><p><b>Why:</b> ${notify.esc(reason)}</p>${notify.postTable([post], settings.timezone)}<p><a href="${notify.studioUrl("?tab=pending")}">Request again, or post it as it was</a></p>`)
  );
  return { ok: true };
}

async function requestChanges(member, postId, note) {
  return requestChange(member, postId, { note });
}

async function postNow(member, postId, { override_reason } = {}) {
  requireRole(member, ["approver"]);
  const store = getStore();
  const settings = await getSettings();
  if (!settings.publishing_enabled) throw new HttpError(409, "Publishing is paused. Resume it on the Health tab first.");
  let post = await getPostOr404(postId);
  assertNotSent(post);
  if (["pending", "changes_requested"].includes(post.status)) {
    const lint = lintPost(post);
    if (hasErrors(lint) && !(override_reason && override_reason.trim().length >= 5)) {
      throw new HttpError(409, `This post breaks a rule: ${lint.filter((l) => l.level === "error").map((l) => l.message).join(" ")}`);
    }
    [post] = await store.update("social_posts", { post_id: postId, status: post.status, version: post.version }, {
      status: "approved",
      approved_by: member.email,
      approved_at: now().toISOString(),
      updated_at: now().toISOString(),
    });
    if (!post) throw new HttpError(409, "The post changed. Refresh and try again.");
  } else if (post.status === "scheduled") {
    await unschedule(post, member.email, "post now");
    [post] = await store.update("social_posts", { post_id: postId, status: "scheduled" }, { status: "approved", buffer_id: null, updated_at: now().toISOString() });
  } else if (post.status !== "approved") {
    throw new HttpError(409, `A ${post.status} post cannot be posted now.`);
  }
  await audit(member.email, "post.post_now", postId, { override_reason: override_reason || null, planned_slot: post.slot_at });
  // Posting now: the post's time becomes now, so the sync picks it up within a minute.
  await store.update("social_posts", { post_id: postId, status: "approved" }, { slot_at: new Date(Math.floor(now().getTime() / 1000) * 1000).toISOString() });
  const result = await schedulePost(postId, { shareNow: true });
  await refreshBatchStatus(post.batch_id);
  return result;
}

async function deleteBatch(member, batchId) {
  requireRole(member, ["approver"]);
  const store = getStore();
  const batch = await store.get("social_batches", batchId);
  if (!batch) throw new HttpError(404, "Batch not found");
  const posts = await store.list("social_posts", { where: { batch_id: batchId } });
  for (const p of posts) {
    if (["posted", "dropped", "missed", "posting"].includes(p.status)) continue;
    if (p.status === "scheduled" && !isDryRunId(p.buffer_id) && Date.parse(p.slot_at) <= now().getTime()) continue;
    await unschedule(p, member.email, "batch deleted");
    await store.update("social_posts", { post_id: p.post_id }, { status: "dropped", buffer_id: null, error: "Batch deleted", updated_at: now().toISOString() });
  }
  await store.update("social_batches", { batch_id: batchId }, { status: "deleted", deleted_copy: { batch, posts }, updated_at: now().toISOString() });
  await audit(member.email, "batch.deleted", batchId, { posts: posts.length });
  return { ok: true };
}

async function addComment(member, { post_id, batch_id, body }) {
  requireRole(member, ["approver", "editor", "viewer"]);
  if (!body || !body.trim()) throw new HttpError(422, "Write a comment first.");
  const store = getStore();
  let batchId = batch_id || null;
  if (post_id) batchId = (await getPostOr404(post_id)).batch_id;
  const [c] = await store.insert("social_comments", {
    comment_id: `C-${hex(10)}`,
    post_id: post_id || null,
    batch_id: batchId,
    author_email: member.email,
    author_name: member.name,
    kind: "comment",
    body: body.trim().slice(0, 4000),
    resolved: false,
    created_at: now().toISOString(),
  });
  await audit(member.email, "comment.added", post_id || batch_id);
  return c;
}

// Kill switch. Anyone on the team can pause; only the approver can resume.
async function setPublishing(member, enabled) {
  requireRole(member, enabled ? ["approver"] : ["approver", "editor"]);
  const store = getStore();
  await setSetting("publishing_enabled", Boolean(enabled), member.email);
  const result = { publishing_enabled: Boolean(enabled), pulled: [], scheduled: [] };
  if (!enabled) {
    const future = await store.list("social_posts", { where: { status: "scheduled", slot_at: { gt: now().toISOString() } } });
    for (const p of future) {
      try {
        await unschedule(p, member.email, "publishing paused");
        await store.update("social_posts", { post_id: p.post_id, status: "scheduled" }, { status: "approved", buffer_id: null, error: "Paused: will be scheduled again on resume", updated_at: now().toISOString() });
        result.pulled.push(p.post_id);
      } catch (e) {
        result.pulled.push(`${p.post_id} (could not remove from Buffer: ${e.message})`);
      }
    }
    await alert("publishing paused", `<p>${notify.esc(member.name)} paused publishing. ${result.pulled.length} queued posts were pulled from Buffer and will go back on resume.</p>`);
  } else {
    const waiting = await store.list("social_posts", { where: { status: "approved", buffer_id: { is: null } }, order: ["slot_at", "asc"] });
    for (const p of waiting) {
      const r = await schedulePost(p.post_id);
      result.scheduled.push(`${p.post_id}: ${r ? r.status : "?"}`);
    }
  }
  await audit(member.email, enabled ? "publishing.resumed" : "publishing.paused", null, result);
  return result;
}

// ---------------- revisions from the writing agent ----------------
const revisionSchema = z.object({
  post_id: z.string(),
  from_version: z.number().int(),
  body: z.string().min(1).max(5000),
  slides: z.array(slideSchema).max(10).optional(),
  // Only for a change request that needs it (e.g. a text post that should now carry a picture).
  kind: z.enum(["text", "image", "carousel", "document"]).optional(),
  format: z.enum(FORMAT_KEYS).optional(),
  alt: z.array(z.string().max(500)).max(10).optional(),
  sources: z.array(sourceSchema).max(20).optional(),
  claims: z.array(claimSchema).max(20).optional(),
  scores: z.record(z.string(), z.number()).optional(),
  note: z.string().max(1000),
});

async function submitRevision(raw, actor = "claude") {
  const input = parse(revisionSchema, raw);
  const store = getStore();
  const post = await getPostOr404(input.post_id);
  if (!["changes_requested", "pending"].includes(post.status)) {
    return { ok: false, message: `Post is ${post.status}; only posts waiting for approval or sent back can be revised.` };
  }
  if (post.version !== input.from_version) {
    return { ok: false, message: `Post is now at version ${post.version}, not ${input.from_version}. Read it again before revising.` };
  }
  const batch = await store.get("social_batches", post.batch_id);
  if (input.slides && input.slides.some((x) => x.photo)) {
    try {
      input.slides = await photos.ingestSlides(input.slides, actor);
    } catch (e) {
      return { ok: false, message: `Nothing was saved. ${e.message}` };
    }
  }
  const next = {
    ...post,
    kind: input.kind || post.kind,
    format: input.format || post.format,
    body: addUtm(input.body, { channel: post.channel, campaign: `wk${String(batch ? batch.week_start : "").replace(/-/g, "")}`, content: post.post_id }),
    slides: input.slides || post.slides,
    alt: input.alt || post.alt,
    sources: input.sources || post.sources,
    claims: input.claims || post.claims,
    scores: input.scores || post.scores,
  };
  const lint = lintPost(next);
  if (hasErrors(lint)) return { ok: false, message: "The revision breaks a rule; nothing was saved.", errors: lint.filter((l) => l.level === "error") };
  const [saved] = await store.update("social_posts", { post_id: post.post_id, version: post.version }, {
    body: next.body,
    kind: next.kind,
    ...(next.format ? { format: next.format } : {}),
    slides: next.slides,
    alt: next.alt,
    sources: next.sources,
    claims: next.claims,
    scores: next.scores,
    lint,
    version: post.version + 1,
    status: "pending",
    ...(post.change_request ? { change_request: { ...post.change_request, state: "done", done_at: now().toISOString(), writer_note: input.note } } : {}),
    updated_at: now().toISOString(),
  });
  if (!saved) return { ok: false, message: "The post changed during the revision. Read it again." };
  await store.insert("social_post_versions", {
    post_id: post.post_id,
    version: saved.version,
    body: saved.body,
    slides: saved.slides,
    change_kind: "revision",
    changed_by: actor,
    note: input.note,
    created_at: now().toISOString(),
  });
  await store.update("social_comments", { post_id: post.post_id, kind: "change_request", resolved: false }, { resolved: true });
  await audit(actor, "post.revised", post.post_id, { version: saved.version, note: input.note });
  warmMedia([saved]);
  await refreshBatchStatus(post.batch_id);
  const settings = await getSettings();
  await notify.send(
    await notify.approverEmails(),
    `EEC Social: revised post ready (${notify.whenLocal(saved.slot_at, settings.timezone)})`,
    notify.wrap("A revised post is ready", `<p>${notify.esc(input.note)}</p>${notify.postTable([saved], settings.timezone)}<p><a href="${notify.studioUrl("?tab=pending")}">Review it</a></p>`)
  );
  return { ok: true, post_id: saved.post_id, version: saved.version };
}

// The fact checker's result for a post. Stores the verdicts on the post's claims; anything not
// confirmed becomes a comment on the post and an email to the approvers. Never changes the text.
const factCheckSchema = z.object({
  post_id: z.string(),
  checks: z.array(claimSchema.extend({ corrected_text: z.string().max(500).optional() })).min(1).max(20),
});
async function recordFactCheck(raw, actor = "claude") {
  const input = parse(factCheckSchema, raw);
  const store = getStore();
  const post = await getPostOr404(input.post_id);
  if (!["pending", "changes_requested", "approved", "scheduled"].includes(post.status)) {
    return { ok: false, message: `Post is ${post.status}; only posts that have not gone out are checked.` };
  }
  const at = now().toISOString();
  const claims = input.checks.map((c) => ({
    text: c.text,
    source: c.source,
    date: c.date,
    verdict: c.verdict || "unverifiable",
    note: [c.corrected_text ? `Correct: ${c.corrected_text}` : "", c.note || ""].filter(Boolean).join(" ").slice(0, 500) || undefined,
    checked_at: at,
  }));
  await store.update("social_posts", { post_id: post.post_id }, { claims, updated_at: at });
  const problems = claims.filter((c) => c.verdict !== "confirmed");
  await audit(actor, "post.fact_checked", post.post_id, { checked: claims.length, problems: problems.length });
  if (!problems.length) return { ok: true, confirmed: claims.length };

  const settings = await getSettings();
  const live = ["approved", "scheduled"].includes(post.status);
  const lines = problems.map((c) => `- ${c.verdict === "corrected" ? "Changed" : "Could not verify"}: "${c.text}"${c.note ? ` (${c.note})` : ""}${c.source ? ` Source: ${c.source}` : ""}`);
  const body = `Fact check before posting found ${problems.length} problem${problems.length > 1 ? "s" : ""}:\n${lines.join("\n")}${live ? "\nThis post is already approved. Edit it (it then needs approval again) or drop it before it goes out." : ""}`;
  await store.insert("social_comments", {
    comment_id: `C-${hex(10)}`,
    post_id: post.post_id,
    batch_id: post.batch_id,
    author_email: "fact-checker@eec-social",
    author_name: "Fact checker",
    kind: "comment",
    body: body.slice(0, 4000),
    resolved: false,
    processed_at: at, // the engine's own note: not something to learn from
    created_at: at,
  });
  await notify.send(
    await notify.approverEmails(),
    `EEC Social: check a fact before ${notify.whenLocal(post.slot_at, settings.timezone)}`,
    notify.wrap(
      "A fact needs your attention",
      `${notify.postTable([post], settings.timezone)}<ul>${problems.map((c) => `<li><b>${c.verdict === "corrected" ? "Changed" : "Could not verify"}:</b> ${notify.esc(c.text)}${c.note ? `<br>${notify.esc(c.note)}` : ""}</li>`).join("")}</ul><p><a href="${notify.studioUrl(live ? "?tab=queue" : "?tab=pending")}">Open the post</a></p>`
    )
  );
  return { ok: true, confirmed: claims.length - problems.length, problems: problems.length, approver_told: true };
}

module.exports = {
  removeUnpublished,
  requestChange,
  cancelChange,
  retryChange,
  failChange,
  changeReadyBy,
  slideUrl,
  documentUrl,
  recordFactCheck,
  memberFor,
  requireRole,
  checkPosts,
  submitBatch,
  schedulePost,
  approvePost,
  approveBatch,
  unapprovePost,
  editPost,
  dropPost,
  requestChanges,
  postNow,
  deleteBatch,
  addComment,
  setPublishing,
  submitRevision,
  refreshBatchStatus,
  mediaUrls,
  alert,
  setClock,
  now,
  isDryRunId,
  LIVE,
  CHANNELS,
};
