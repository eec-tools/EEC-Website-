// Outreach: on outreach days (Mon/Wed/Fri by default) the writer reads the LinkedIn pages of buyers in
// EEC's markets, picks their recent posts and drafts one short, useful comment for each. The team posts
// the comments from the EEC page by hand on the Studio Outreach tab; nothing is posted automatically.
// The team marks what happened (reply, conversation, enquiry) and the writer learns which comments work.
const HttpError = require("../utils/httpError");
const { getStore } = require("./store");
const { getSettings, audit } = require("./settings");
const { localParts, zonedToUtc } = require("./time");

const DEFAULTS = { enabled: true, days: ["mon", "wed", "fri"], per_run: 10, markets: ["UK", "EU", "US", "Canada", "Australia", "South Africa", "Middle East", "Asia-Pacific"] };
const MAX_POST_AGE_DAYS = 10; // company pages show about two weeks of posts; older ones are not worth a comment
const TARGET_REST_DAYS = 7; // at most one comment per target a week
const CHECK_REST_DAYS = 2; // a target's page is read at most every two days
const READY_DAYS = 4; // a comment not posted within this many days is set aside (the post has gone stale)
const MAX_TARGETS_ADDED = 10; // per run, by the writer
const MAX_TARGETS = 300;
const ANGLES = ["tip", "question", "fact", "experience", "congrats"];
const OUTCOMES = ["none", "reply", "conversation", "enquiry"];

const clip = (s, n) => (s == null ? null : String(s).trim().slice(0, n) || null);
const isUrl = (u) => /^https?:\/\/\S+$/i.test(String(u || "").trim());

async function config() {
  const s = await getSettings();
  const o = { ...DEFAULTS, ...(s.outreach || {}) };
  return { ...o, per_run: Math.max(1, Math.min(30, Number(o.per_run) || DEFAULTS.per_run)), timezone: s.timezone };
}

// A LinkedIn page or profile link in one form, so the same target is never added twice.
function normLinkedIn(u) {
  const m = String(u || "")
    .trim()
    .match(/^https?:\/\/(?:[a-z]{2,3}\.|www\.)?linkedin\.com\/(company|showcase|school|in)\/([^/?#\s]+)/i);
  if (!m) return null;
  return `https://www.linkedin.com/${m[1].toLowerCase()}/${decodeURIComponent(m[2]).toLowerCase()}`;
}

function normPostUrl(u) {
  const s = String(u || "").trim();
  if (!/^https?:\/\/(?:[a-z]{2,3}\.|www\.)?linkedin\.com\/(?:posts\/|feed\/update\/)/i.test(s)) return null;
  return s.replace(/^https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com/i, "https://www.linkedin.com").split(/[?#]/)[0].replace(/\/$/, "");
}

// LinkedIn post ids carry their own time: the first 41 bits are milliseconds since 1970.
function postTime(url, nowMs = Date.now()) {
  const m = String(url || "").match(/(?:activity|share|ugcPost)[-:](\d{18,20})/);
  if (!m) return null;
  try {
    const ms = Number(BigInt(m[1]) >> 22n);
    if (ms < Date.UTC(2015, 0, 1) || ms > nowMs + 86400000) return null;
    return new Date(ms).toISOString();
  } catch (e) {
    return null;
  }
}

// EEC's voice for a comment: useful, short, human, never an advert.
const CONTRACTION = /\b(?:\w+n['’]t|I['’](?:m|ve|ll|d)|(?:you|we|they|who|what|where|there|that|it|he|she|let|here|how)['’](?:re|ve|ll|d|s))\b/i;
const SELLING = /\b(dm\b|inbox|pm me|contact us|reach out to us|get in touch|book a call|schedule a call|whatsapp|call us|email us|visit our|check out our|our services|we offer|we provide|we can help you|happy to help you source|let'?s connect|link in (?:bio|comments)|free consultation|special offer|discount)\b/i;
const HYPE = /\b(game[- ]?changer|unlock|secret|hack|skyrocket|supercharge|revolutioni[sz]e|must[- ]have|mind[- ]blowing|insane|10x)\b/i;
const FLATTERY = /^(?:great|nice|awesome|amazing|love this|so true|well said|congrats(?:ulations)?)[\s!.,]*$/i;
const RISKY = /\b(guarantee(?:d|s)?|100% (?:verified|compliant|guaranteed)|all (?:our )?suppliers (?:are|hold|have))\b/i;

function lintComment(text) {
  const t = String(text || "").trim();
  const problems = [];
  if (t.length < 60) problems.push("Too short: say something useful (60 characters or more).");
  if (t.length > 700) problems.push("Too long: keep it to 1 to 3 sentences (700 characters at most).");
  if ((t.match(/[.!?](\s|$)/g) || []).length > 4) problems.push("More than 4 sentences.");
  if (/https?:\/\/|www\.|\b[\w-]+\.(?:com|in|sg|co|net|org)\b/i.test(t)) problems.push("No links in comments.");
  if (/[\w.+-]+@[\w-]+\.\w+/.test(t) || /\+?\d[\d\s-]{8,}\d/.test(t)) problems.push("No email addresses or phone numbers.");
  if (/(^|\s)#\w/.test(t)) problems.push("No hashtags in comments.");
  if (SELLING.test(t)) problems.push("Reads as selling: no calls to contact EEC, no offers, no service pitch.");
  if (HYPE.test(t)) problems.push("Hype wording.");
  if (RISKY.test(t)) problems.push("Guarantee or absolute claim.");
  if (FLATTERY.test(t)) problems.push("Empty praise: add a point of substance.");
  if (/[–—]/.test(t)) problems.push("Em or en dash: use a comma, colon or full stop.");
  if (CONTRACTION.test(t)) problems.push("Contraction: EEC writes words in full (do not, it is).");
  if ((t.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || []).length > 1) problems.push("At most one emoji.");
  return problems;
}

function isOutreachDay(cfg, now) {
  const lp = localParts(now, cfg.timezone);
  return { ok: cfg.enabled !== false && (cfg.days || []).includes(lp.weekday) && lp.hour >= 6, lp };
}

// For start_run: is an outreach job due now?
async function due(now = new Date()) {
  const store = getStore();
  const cfg = await config();
  const { ok, lp } = isOutreachDay(cfg, now);
  const rewrites = (await store.list("social_outreach_comments", { where: { status: "rewrite" }, limit: 50 })).length;
  let find = 0;
  if (ok) {
    const done = await store.list("social_audit", { where: { action: "job.outreach", at: { gte: zonedToUtc(lp.date, "00:00", cfg.timezone).toISOString() } }, limit: 5 });
    const findDone = done.some((a) => (a.detail || {}).mode !== "rewrite");
    if (!findDone) {
      const today = (await store.list("social_outreach_comments", { where: { batch_date: lp.date }, limit: 100 })).length;
      find = Math.max(0, cfg.per_run - today);
    }
  }
  return find || rewrites ? { job: "outreach", comments_to_find: find, rewrites } : null;
}

async function competitorKeys() {
  const store = getStore();
  const [companies, people] = await Promise.all([store.list("social_competitors", {}).catch(() => []), store.list("social_competitor_people", {}).catch(() => [])]);
  const names = new Set([...companies, ...people].map((c) => String(c.name || "").toLowerCase().trim()).filter(Boolean));
  const urls = new Set([...companies, ...people].map((c) => normLinkedIn(c.linkedin_url || c.url)).filter(Boolean));
  return { names, urls, list: [...companies, ...people].map((c) => c.name) };
}

// What the writer needs for the outreach job.
async function queue(now = new Date()) {
  const store = getStore();
  const cfg = await config();
  const { lp } = isOutreachDay(cfg, now);
  const d = await due(now);
  const targets = await store.list("social_outreach_targets", { where: { active: true }, limit: 1000 });
  const checkCut = new Date(now.getTime() - CHECK_REST_DAYS * 86400000).toISOString();
  const restCut = new Date(now.getTime() - TARGET_REST_DAYS * 86400000).toISOString();
  const ready = targets
    .filter((t) => (!t.checked_at || t.checked_at < checkCut) && (!t.last_commented_at || t.last_commented_at < restCut))
    .sort((a, b) => String(a.checked_at || "").localeCompare(String(b.checked_at || "")))
    .slice(0, 30);
  const all = await store.list("social_outreach_comments", { order: ["created_at", "desc"], limit: 400 });
  const rewrites = all.filter((c) => c.status === "rewrite");
  const comp = await competitorKeys();
  return {
    today: lp.date,
    comments_to_find: d ? d.comments_to_find : 0,
    markets: cfg.markets,
    channel: "LinkedIn, commenting as the EEC company page",
    targets_to_read: ready.map((t) => ({ id: t.id, name: t.name, kind: t.kind, linkedin_url: t.linkedin_url, market: t.market, category: t.category, reason: t.reason, last_checked: t.checked_at })),
    targets_total: targets.length,
    targets_resting: targets.length - ready.length,
    never_comment_on: comp.list,
    known_post_urls: all.map((c) => c.post_url),
    recent_comments: all.slice(0, 40).map((c) => ({ angle: c.angle, comment: c.comment, status: c.status, outcome: c.outcome })),
    what_works: await stats(now, 60).then((s) => s.by_angle),
    rewrites: rewrites.map((c) => ({ id: c.id, target: c.target_name, post_url: c.post_url, post_excerpt: c.post_excerpt, comment: c.comment, request: c.rewrite_request, earlier: (c.previous || []).map((p) => p.comment) })),
    limits: { max_post_age_days: MAX_POST_AGE_DAYS, one_comment_per_target_every_days: TARGET_REST_DAYS, comment_chars: "60 to 700", max_targets_added_per_run: MAX_TARGETS_ADDED },
  };
}

// Add buyers to the target list (the writer or the team).
async function saveTargets(list, by, now = new Date()) {
  const store = getStore();
  const comp = await competitorKeys();
  const existing = await store.list("social_outreach_targets", { limit: 2000 });
  const byUrl = new Map(existing.map((t) => [t.linkedin_url, t]));
  const added = [];
  const skipped = [];
  const cap = by === "writer" ? MAX_TARGETS_ADDED : 50;
  for (const raw of (list || []).slice(0, cap)) {
    const name = clip(raw.name, 160);
    const url = normLinkedIn(raw.linkedin_url);
    if (!name || !url) {
      skipped.push({ name, reason: "needs a name and a LinkedIn company or profile link" });
      continue;
    }
    if (comp.urls.has(url) || comp.names.has(name.toLowerCase())) {
      skipped.push({ name, reason: "is on the Competitors tab" });
      continue;
    }
    if (byUrl.has(url)) {
      const t = byUrl.get(url);
      if (!t.active && by !== "writer") {
        await store.update("social_outreach_targets", { id: t.id }, { active: true, updated_at: now.toISOString() });
        added.push({ id: t.id, name: t.name, reactivated: true });
      } else skipped.push({ name, reason: t.active ? "already on the list" : "removed by the team earlier" });
      continue;
    }
    if (existing.length + added.length >= MAX_TARGETS) {
      skipped.push({ name, reason: `the list is full (${MAX_TARGETS})` });
      continue;
    }
    const [row] = await store.insert("social_outreach_targets", {
      name,
      kind: raw.kind === "person" || /\/in\//.test(url) ? "person" : "company",
      linkedin_url: url,
      market: clip(raw.market, 60),
      category: clip(raw.category, 80),
      reason: clip(raw.reason, 400),
      active: true,
      added_by: by,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    });
    byUrl.set(url, row);
    added.push({ id: row.id, name });
  }
  if (added.length) await audit(by === "writer" ? "claude" : by, "outreach.targets.added", null, { added: added.map((a) => a.name) });
  return { added, skipped };
}

// Save the writer's drafts (and record which targets it read).
async function submitComments(input, now = new Date()) {
  const store = getStore();
  const cfg = await config();
  const today = localParts(now, cfg.timezone).date;
  const at = now.toISOString();

  // Pages read this run, even with nothing worth a comment.
  let checked = 0;
  for (const c of (input.checked_targets || []).slice(0, 60)) {
    const t = await store.get("social_outreach_targets", Number(c.id));
    if (!t) continue;
    const latest = c.latest_post_url ? postTime(c.latest_post_url, now.getTime()) : null;
    await store.update("social_outreach_targets", { id: t.id }, { checked_at: at, ...(latest ? { last_post_at: latest } : {}), updated_at: at });
    checked += 1;
  }

  const todayRows = await store.list("social_outreach_comments", { where: { batch_date: today }, limit: 200 });
  let room = Math.max(0, cfg.per_run - todayRows.length);
  const comp = await competitorKeys();
  const restCut = new Date(now.getTime() - TARGET_REST_DAYS * 86400000).toISOString();
  const usedTargets = new Set(todayRows.map((r) => r.target_id));
  const saved = [];
  const refused = [];
  for (const c of (input.comments || []).slice(0, 30)) {
    const url = normPostUrl(c.post_url);
    const why = [];
    if (!url) why.push("post_url must be a public LinkedIn post link (linkedin.com/posts/... or /feed/update/...)");
    const target = c.target_id ? await store.get("social_outreach_targets", Number(c.target_id)) : null;
    const name = clip(c.author || (target && target.name), 160);
    if (!name) why.push("say whose post it is (target_id or author)");
    if (name && comp.names.has(name.toLowerCase())) why.push("never comment on competitors");
    if (target && target.last_commented_at && target.last_commented_at > restCut) why.push(`${target.name} already had a comment in the last ${TARGET_REST_DAYS} days`);
    if (target && usedTargets.has(target.id)) why.push(`one comment per target per run (${target.name})`);
    const postedAt = postTime(url, now.getTime()) || (/^\d{4}-\d{2}-\d{2}/.test(c.posted_on || "") ? new Date(c.posted_on).toISOString() : null);
    if (postedAt && Date.parse(postedAt) < now.getTime() - MAX_POST_AGE_DAYS * 86400000) why.push(`the post is older than ${MAX_POST_AGE_DAYS} days`);
    if (url && (await store.list("social_outreach_comments", { where: { post_url: url }, limit: 1 })).length) why.push("this post already has a drafted comment");
    const problems = lintComment(c.comment);
    if (!ANGLES.includes(c.angle)) problems.push(`angle must be one of ${ANGLES.join(", ")}`);
    const sources = (Array.isArray(c.sources) ? c.sources : []).filter((s) => s && isUrl(s.url)).slice(0, 4).map((s) => ({ title: clip(s.title, 200), url: clip(s.url, 500), date: clip(s.date, 20) }));
    if (c.angle === "fact" && !sources.length) problems.push("a fact comment needs a source link (shown to the team, not in the comment)");
    if (!room) why.push(`today already has ${cfg.per_run} comments`);
    if (why.length || problems.length) {
      refused.push({ post_url: c.post_url, problems: [...why, ...problems] });
      continue;
    }
    const [row] = await store.insert("social_outreach_comments", {
      target_id: target ? target.id : null,
      target_name: name,
      channel: "linkedin",
      post_url: url,
      post_posted_at: postedAt,
      post_excerpt: clip(c.post_excerpt, 600),
      post_reactions: Number.isFinite(Number(c.reactions)) ? Number(c.reactions) : null,
      post_comments: Number.isFinite(Number(c.comments)) ? Number(c.comments) : null,
      why_picked: clip(c.why_picked, 400),
      comment: String(c.comment).trim(),
      angle: c.angle,
      sources,
      status: "ready",
      batch_date: today,
      created_at: at,
      updated_at: at,
    });
    if (target) usedTargets.add(target.id);
    room -= 1;
    saved.push(row.id);
  }
  await audit("claude", "outreach.drafted", today, { saved: saved.length, refused: refused.length, checked });
  return { ok: true, saved: saved.length, refused, targets_checked: checked, room_left_today: room };
}

// The writer's new version after "Write another version".
async function reviseComments(items, now = new Date()) {
  const store = getStore();
  const out = [];
  for (const it of (items || []).slice(0, 20)) {
    const row = await store.get("social_outreach_comments", Number(it.id));
    if (!row) {
      out.push({ id: it.id, ok: false, message: "not found" });
      continue;
    }
    if (row.status !== "rewrite") {
      out.push({ id: it.id, ok: false, message: "no new version was asked for" });
      continue;
    }
    const problems = lintComment(it.comment);
    if (it.angle && !ANGLES.includes(it.angle)) problems.push(`angle must be one of ${ANGLES.join(", ")}`);
    if (String(it.comment || "").trim() === row.comment) problems.push("the new version is the same as the old one");
    if (problems.length) {
      out.push({ id: it.id, ok: false, problems });
      continue;
    }
    await store.update("social_outreach_comments", { id: row.id }, {
      previous: [...(row.previous || []), { comment: row.comment, at: row.updated_at, by: row.edited ? "team" : "writer", request: row.rewrite_request }].slice(-6),
      comment: String(it.comment).trim(),
      angle: it.angle || row.angle,
      status: "ready",
      rewrite_request: null,
      edited: false,
      updated_at: now.toISOString(),
    });
    out.push({ id: row.id, ok: true });
  }
  return { results: out };
}

// ---------------- Studio ----------------

async function list(now = new Date()) {
  const store = getStore();
  const cfg = await config();
  const [comments, targets] = await Promise.all([
    store.list("social_outreach_comments", { order: ["created_at", "desc"], limit: 300 }),
    store.list("social_outreach_targets", { order: ["name", "asc"], limit: 1000 }),
  ]);
  const { lp } = isOutreachDay(cfg, now);
  return {
    config: { days: cfg.days, per_run: cfg.per_run, markets: cfg.markets, enabled: cfg.enabled !== false },
    today: lp.date,
    next_run: nextRunDay(cfg, now),
    comments,
    targets,
    stats: await stats(now, 30),
  };
}

function nextRunDay(cfg, now) {
  for (let i = 0; i < 8; i += 1) {
    const d = new Date(now.getTime() + i * 86400000);
    const lp = localParts(d, cfg.timezone);
    if ((cfg.days || []).includes(lp.weekday) && (i > 0 || lp.hour < 12)) return lp.date;
  }
  return null;
}

async function act(member, id, action, body = {}, now = new Date()) {
  require("./service").requireRole(member, ["approver", "editor"]);
  const store = getStore();
  const row = await store.get("social_outreach_comments", Number(id));
  if (!row) throw new HttpError(404, "Comment not found");
  const at = now.toISOString();
  const by = member.email;
  let patch;
  if (action === "posted") {
    if (!["ready", "expired"].includes(row.status)) throw new HttpError(409, "This comment is not waiting to be posted.");
    const text = body.comment != null ? String(body.comment).trim() : row.comment;
    patch = { status: "posted", posted_at: at, posted_by: by, ...(text !== row.comment ? { comment: text, edited: true, previous: [...(row.previous || []), { comment: row.comment, at: row.updated_at, by: "writer" }] } : {}) };
    if (row.target_id) await store.update("social_outreach_targets", { id: row.target_id }, { last_commented_at: at, updated_at: at });
  } else if (action === "skip") {
    if (!["ready", "rewrite", "expired"].includes(row.status)) throw new HttpError(409, "Only a comment that has not been posted can be skipped.");
    patch = { status: "skipped", skip_reason: clip(body.reason, 300), posted_by: by };
  } else if (action === "rewrite") {
    if (!["ready", "expired"].includes(row.status)) throw new HttpError(409, "Only a comment that has not been posted can be rewritten.");
    patch = { status: "rewrite", rewrite_request: clip(body.request, 500) || "Write a different version." };
  } else if (action === "edit") {
    const text = String(body.comment || "").trim();
    if (!text) throw new HttpError(422, "The comment is empty.");
    if (!["ready", "expired"].includes(row.status)) throw new HttpError(409, "This comment can no longer be edited here.");
    patch = { comment: text, edited: true, previous: [...(row.previous || []), { comment: row.comment, at: row.updated_at, by: row.edited ? "team" : "writer" }].slice(-6) };
  } else if (action === "outcome") {
    if (row.status !== "posted") throw new HttpError(409, "Mark the result once the comment is posted.");
    if (!OUTCOMES.includes(body.outcome)) throw new HttpError(422, `outcome must be one of ${OUTCOMES.join(", ")}`);
    patch = { outcome: body.outcome, outcome_note: clip(body.note, 500), outcome_at: at, outcome_by: by };
  } else if (action === "undo") {
    if (!["posted", "skipped"].includes(row.status)) throw new HttpError(409, "Nothing to undo.");
    patch = { status: "ready", posted_at: null, posted_by: null, skip_reason: null, outcome: null, outcome_note: null, outcome_at: null, outcome_by: null, batch_date: row.batch_date };
  } else throw new HttpError(422, "Unknown action");
  const [saved] = await store.update("social_outreach_comments", { id: row.id }, { ...patch, updated_at: at });
  await audit(by, `outreach.${action}`, String(row.id), { target: row.target_name, ...(body.outcome ? { outcome: body.outcome } : {}) });
  return saved;
}

async function addTarget(member, body, now = new Date()) {
  require("./service").requireRole(member, ["approver", "editor"]);
  const r = await saveTargets([body], member.email, now);
  if (!r.added.length) throw new HttpError(422, `Not added: ${(r.skipped[0] || {}).reason || "check the details"}.`);
  return r;
}

async function updateTarget(member, id, body, now = new Date()) {
  require("./service").requireRole(member, ["approver", "editor"]);
  const store = getStore();
  const row = await store.get("social_outreach_targets", Number(id));
  if (!row) throw new HttpError(404, "Target not found");
  const patch = {};
  for (const [f, n] of [["name", 160], ["market", 60], ["category", 80], ["reason", 400]]) if (body[f] !== undefined) patch[f] = clip(body[f], n);
  if (body.active !== undefined) patch.active = Boolean(body.active);
  const [saved] = await store.update("social_outreach_targets", { id: row.id }, { ...patch, updated_at: now.toISOString() });
  await audit(member.email, "outreach.target.updated", String(row.id), patch);
  return saved;
}

// Daily: comments nobody posted within a few days are set aside (the post is no longer fresh).
async function expire(now = new Date()) {
  const store = getStore();
  const cut = new Date(now.getTime() - READY_DAYS * 86400000).toISOString();
  const old = await store.list("social_outreach_comments", { where: { status: "ready", created_at: { lt: cut } }, limit: 200 });
  for (const c of old) await store.update("social_outreach_comments", { id: c.id }, { status: "expired", updated_at: now.toISOString() });
  return old.length;
}

async function stats(now = new Date(), days = 30) {
  const store = getStore();
  const since = new Date(now.getTime() - days * 86400000).toISOString();
  const rows = (await store.list("social_outreach_comments", { where: { created_at: { gte: since } }, limit: 1000 }).catch(() => [])).filter((r) => !r.created_at || r.created_at <= now.toISOString());
  const posted = rows.filter((r) => r.status === "posted");
  const won = (r) => ["reply", "conversation", "enquiry"].includes(r.outcome);
  const by_angle = {};
  for (const r of posted) {
    const a = (by_angle[r.angle || "other"] = by_angle[r.angle || "other"] || { posted: 0, replies: 0, enquiries: 0, marked: 0 });
    a.posted += 1;
    if (r.outcome) a.marked += 1;
    if (won(r)) a.replies += 1;
    if (r.outcome === "enquiry") a.enquiries += 1;
  }
  return {
    days,
    drafted: rows.length,
    posted: posted.length,
    skipped: rows.filter((r) => r.status === "skipped").length,
    expired: rows.filter((r) => r.status === "expired").length,
    replies: posted.filter(won).length,
    enquiries: posted.filter((r) => r.outcome === "enquiry").length,
    by_angle,
    skip_reasons: rows.filter((r) => r.status === "skipped" && r.skip_reason).slice(0, 15).map((r) => r.skip_reason),
  };
}

async function readyCount() {
  return (await getStore().list("social_outreach_comments", { where: { status: "ready" }, limit: 200 }).catch(() => [])).length;
}

module.exports = { due, queue, saveTargets, submitComments, reviseComments, list, act, addTarget, updateTarget, expire, stats, readyCount, lintComment, postTime, normLinkedIn, normPostUrl, config, ANGLES, OUTCOMES, MAX_POST_AGE_DAYS, TARGET_REST_DAYS };
