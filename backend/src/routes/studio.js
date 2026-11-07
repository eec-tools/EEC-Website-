// /api/studio: the Social Studio page. Everyone signs in with their own account; what they can
// do comes from social_members (approver, editor, viewer).
const express = require("express");
const { z } = require("zod");
const asyncHandler = require("../middleware/asyncHandler");
const { requireAuth } = require("../middleware/requireAuth");
const HttpError = require("../utils/httpError");
const { getStore } = require("../social/store");
const { getSettings, setSetting, audit, DEFAULTS } = require("../social/settings");
const { getBuffer } = require("../social/buffer");
const { lintPost } = require("../social/rules");
const { tick, quickSync } = require("../social/tick");
const service = require("../social/service");
const data = require("../social/studioData");
const { mondayOf, addDays, zonedToUtc, localParts } = require("../social/time");
const { missingSchema, filesFor, MIGRATION } = require("../social/dbCheck");
const learning = require("../social/learning");
const outreach = require("../social/outreach");

async function learningWaiting() {
  const store = getStore();
  const rules = (await store.list("social_preferences", { where: { status: "candidate" } })).filter((r) => learning.ruleDomain(r) === "business").length;
  const competitor = (await store.list("social_competitor_learnings", { where: { status: "pending", domain: "business" } }).catch(() => [])).length;
  return { rules, competitor };
}

const router = express.Router();

const member = asyncHandler(async (req, res, next) => {
  req.member = await service.memberFor(req.user);
  if (!req.member) throw new HttpError(403, "You do not have access to the Social Studio. Ask the approver to add your email.");
  next();
});
const auth = [requireAuth, member];

// What is stopping posts from going out, in plain words. level: error (posts will not go out) or warn.
async function systemAlerts(settings) {
  const out = [];
  const store = getStore();
  const live = settings.publishing_enabled && !settings.dry_run;
  if (!process.env.BUFFER_API_KEY) out.push({ level: live ? "error" : "warn", key: "buffer_key", text: "Publishing is not set up: the Buffer key is missing, so approved posts cannot go out." });
  if (!settings.publishing_enabled) out.push({ level: "warn", key: "paused", text: "Publishing is paused. Approved posts wait until the approver resumes it." });
  const mapped = settings.buffer_channels || {};
  const used = Object.entries(settings.cadence || {}).filter(([, c]) => (c.days || []).length).map(([ch]) => ch).filter((ch) => ch !== "linkedin_shirali");
  const missing = used.filter((ch) => !mapped[ch]);
  if (missing.length && process.env.BUFFER_API_KEY) out.push({ level: live ? "error" : "warn", key: "channels", text: `${missing.length} channel${missing.length === 1 ? " is" : "s are"} not connected to Buffer yet.` });
  if (settings.last_tick && Date.now() - Date.parse(settings.last_tick) > 2 * 3600000) out.push({ level: "error", key: "clock", text: "The clock has not run for over 2 hours, so nothing is being sent or reminded." });
  const failed = await store.list("social_posts", { where: { status: "failed" }, limit: 20 }).catch(() => []);
  if (failed.length) out.push({ level: "error", key: "failed", text: `${failed.length} post${failed.length === 1 ? "" : "s"} could not be published.` });
  return out;
}

async function lastWriterRun() {
  const rows = await getStore().list("social_audit", { where: { actor: "claude" }, order: ["at", "desc"], limit: 1 });
  return rows[0] ? rows[0].at : null;
}

function decorate(p) {
  const slides = p.slides || [];
  return {
    ...p,
    // Always the slide images for the page; a document post also links its PDF.
    image_urls: slides.length ? slides.map((_, i) => service.slideUrl(p, i + 1)) : service.mediaUrls(p),
    document_url: p.kind === "document" && slides.length ? service.documentUrl(p) : null,
    lint: lintPost(p),
  };
}

router.get(
  "/studio/me",
  auth,
  asyncHandler(async (req, res) => {
    const settings = await getSettings();
    const dbMissing = await missingSchema().catch(() => []);
    res.json({
      member: req.member,
      timezone: settings.timezone,
      publishing_enabled: settings.publishing_enabled,
      dry_run: settings.dry_run,
      late_window_hours: settings.late_window_hours,
      // When a change requested now would be ready (next scheduled run plus a margin).
      change_ready_by: service.changeReadyBy(settings).toISOString(),
      // Tables or columns the database still lacks (the page shows a banner while any are missing).
      db_update_needed: dbMissing,
      // Learnings waiting for the business team (shown as a number on the Learning and Competitors tabs).
      learning_waiting: await learningWaiting().catch(() => ({ rules: 0, competitor: 0 })),
      // Outreach comments ready to post (shown as a number on the Outreach tab).
      outreach_ready: await outreach.readyCount().catch(() => 0),
      db_migration: filesFor(dbMissing).join(" and then ") || MIGRATION,
      // Problems that stop posts going out, shown as a banner on every Studio page.
      alerts: await systemAlerts(settings).catch(() => []),
      // When the writer last finished a job (shown on the Today page).
      writer_last_run: await lastWriterRun().catch(() => null),
    });
  })
);

// Posts and batches for a date range (default: last week to four weeks ahead).
router.get(
  "/studio/overview",
  auth,
  asyncHandler(async (req, res) => {
    // Check Buffer before answering so the page shows what has really happened (capped at 7 seconds).
    // Skipped right after a button press (sync=0) so the page refreshes at once.
    if (req.query.sync !== "0") await Promise.race([quickSync().catch(() => null), new Promise((r) => setTimeout(r, 7000))]);
    const store = getStore();
    const settings = await getSettings();
    const tz = settings.timezone;
    const today = localParts(new Date(), tz).date;
    const from = /^\d{4}-\d{2}-\d{2}$/.test(req.query.from || "") ? req.query.from : addDays(mondayOf(today), -7);
    const to = /^\d{4}-\d{2}-\d{2}$/.test(req.query.to || "") ? req.query.to : addDays(mondayOf(today), 28);
    const posts = await store.list("social_posts", {
      where: { slot_at: { gte: zonedToUtc(from, "00:00", tz).toISOString(), lt: zonedToUtc(to, "00:00", tz).toISOString() } },
      order: ["slot_at", "asc"],
    });
    const batchIds = [...new Set(posts.map((p) => p.batch_id))];
    const batches = batchIds.length ? await store.list("social_batches", { where: { batch_id: { in: batchIds } } }) : [];
    const comments = posts.length ? await store.list("social_comments", { where: { post_id: { in: posts.map((p) => p.post_id) } }, order: ["created_at", "asc"] }) : [];
    res.json({
      from,
      to,
      timezone: tz,
      synced_at: settings.last_sync || settings.last_tick || null,
      batches: batches.filter((b) => b.status !== "deleted").map((b) => ({ ...b, deleted_copy: undefined })),
      posts: posts.map(decorate),
      comments,
    });
  })
);

router.get(
  "/studio/posts/:id/versions",
  auth,
  asyncHandler(async (req, res) => {
    res.json(await getStore().list("social_post_versions", { where: { post_id: req.params.id }, order: ["version", "asc"] }));
  })
);

const act = (fn) =>
  asyncHandler(async (req, res) => {
    const result = await fn(req);
    res.json(result && result.post_id ? decorate(result) : result || { ok: true });
  });
const plain = (fn) => asyncHandler(async (req, res) => res.json((await fn(req)) || { ok: true }));

router.post("/studio/posts/:id/approve", auth, act((req) => service.approvePost(req.member, req.params.id, { ...(req.body || {}), background: true })));
router.post("/studio/batches/:id/approve", auth, act((req) => service.approveBatch(req.member, req.params.id, { ...(req.body || {}), background: true })));
router.post("/studio/posts/:id/unapprove", auth, act((req) => service.unapprovePost(req.member, req.params.id)));
router.patch("/studio/posts/:id", auth, act((req) => service.editPost(req.member, req.params.id, req.body || {})));
router.post("/studio/posts/:id/drop", auth, act((req) => service.dropPost(req.member, req.params.id, req.body || {})));
router.post("/studio/posts/:id/request-changes", auth, act((req) => service.requestChange(req.member, req.params.id, req.body || {})));
router.post("/studio/posts/:id/request-change", auth, act((req) => service.requestChange(req.member, req.params.id, req.body || {})));
router.post("/studio/posts/:id/cancel-change", auth, act((req) => service.cancelChange(req.member, req.params.id)));
router.post("/studio/posts/:id/retry-change", auth, act((req) => service.retryChange(req.member, req.params.id, req.body || {})));

// Competitors (companies, people, best posts), enquiries, engagers, run log.
router.get("/studio/competitors", auth, plain(() => data.listCompetitors()));
// Confirm or discard a learning (writing rule or competitor learning), or undo the writer's decision.
router.post(
  "/studio/learnings/:kind/:id/decide",
  auth,
  plain(async (req) => {
    service.requireRole(req.member, ["approver", "editor"]);
    const b = req.body || {};
    const r = await learning.decide(req.params.kind, req.params.id, b.decision, b.note, req.member.email);
    return r.row;
  })
);
// Outreach: comments the writer drafted for the team to post from the EEC page, and the target list.
router.get("/studio/outreach", auth, plain(() => outreach.list(service.now())));
router.post("/studio/outreach/comments/:id/:action", auth, plain((req) => outreach.act(req.member, req.params.id, req.params.action, req.body || {}, service.now())));
router.post("/studio/outreach/targets", auth, plain((req) => outreach.addTarget(req.member, req.body || {}, service.now())));
router.patch("/studio/outreach/targets/:id", auth, plain((req) => outreach.updateTarget(req.member, req.params.id, req.body || {}, service.now())));
router.post("/studio/competitors/:list", auth, plain((req) => data.saveCompetitor(req.member, req.params.list, req.body)));
router.patch("/studio/competitors/:list/:id", auth, plain((req) => data.saveCompetitor(req.member, req.params.list, req.body, req.params.id)));
router.delete("/studio/competitors/:list/:id", auth, plain((req) => data.removeCompetitor(req.member, req.params.list, req.params.id)));
router.get("/studio/enquiries", auth, plain((req) => data.listEnquiries({ days: req.query.days })));
router.post("/studio/enquiries", auth, plain((req) => data.saveEnquiry(req.member, req.body)));
router.patch("/studio/enquiries/:id", auth, plain((req) => data.saveEnquiry(req.member, req.body, req.params.id)));
router.delete("/studio/enquiries/:id", auth, plain((req) => data.removeEnquiry(req.member, req.params.id)));
router.get("/studio/posts/:id/engagers", auth, plain((req) => data.listEngagers(req.params.id)));
router.post("/studio/engagers", auth, plain((req) => data.addEngagers(req.member, req.body || {})));
router.patch("/studio/engagers/:id", auth, plain((req) => data.updateEngager(req.member, req.params.id, req.body)));
router.delete("/studio/engagers/:id", auth, plain((req) => data.removeEngager(req.member, req.params.id)));
router.get("/studio/activity", auth, plain((req) => data.listActivity({ days: req.query.days, all: req.query.all === "1" })));
router.post("/studio/posts/:id/post-now", auth, act((req) => service.postNow(req.member, req.params.id, req.body || {})));
router.post("/studio/batches/:id/delete", auth, act((req) => service.deleteBatch(req.member, req.params.id)));
router.post("/studio/comments", auth, act((req) => service.addComment(req.member, req.body || {})));
router.post("/studio/publishing", auth, act((req) => service.setPublishing(req.member, Boolean((req.body || {}).enabled))));

// Manual metrics (LinkedIn personal profiles have no analytics API).
const metricsSchema = z.object({
  impressions: z.number().int().min(0).optional(),
  reach: z.number().int().min(0).optional(),
  reactions: z.number().int().min(0).optional(),
  comments: z.number().int().min(0).optional(),
  shares: z.number().int().min(0).optional(),
  saves: z.number().int().min(0).optional(),
  clicks: z.number().int().min(0).optional(),
  profile_visits: z.number().int().min(0).optional(),
  enquiries: z.number().int().min(0).optional(),
});
router.post(
  "/studio/posts/:id/metrics",
  auth,
  asyncHandler(async (req, res) => {
    service.requireRole(req.member, ["approver", "editor"]);
    const r = metricsSchema.safeParse(req.body || {});
    if (!r.success) throw new HttpError(422, "Metrics must be whole numbers.");
    const store = getStore();
    const post = await store.get("social_posts", req.params.id);
    if (!post) throw new HttpError(404, "Post not found");
    const at = new Date().toISOString();
    await store.insert("social_metrics", { post_id: post.post_id, source: "manual", metrics: r.data, captured_at: at });
    const [p] = await store.update("social_posts", { post_id: post.post_id }, { metrics: { ...(post.metrics || {}), ...r.data, updated: at, entered_by: req.member.email } });
    await audit(req.member.email, "metrics.entered", post.post_id, r.data);
    res.json(decorate(p));
  })
);

router.post(
  "/studio/posts/:id/link",
  auth,
  asyncHandler(async (req, res) => {
    service.requireRole(req.member, ["approver", "editor"]);
    const url = String((req.body || {}).url || "");
    if (!/^https:\/\//.test(url)) throw new HttpError(422, "Paste the full https:// link to the live post.");
    const [p] = await getStore().update("social_posts", { post_id: req.params.id, status: "posted" }, { external_url: url });
    if (!p) throw new HttpError(409, "Only posted posts can have their link set.");
    res.json(decorate(p));
  })
);

router.get(
  "/studio/insights",
  auth,
  asyncHandler(async (req, res) => {
    const weeks = Math.min(Math.max(Number(req.query.weeks) || 8, 1), 52);
    const span = weeks * 7 * 86400000;
    const since = new Date(Date.now() - span).toISOString();
    const before = new Date(Date.now() - 2 * span).toISOString();
    const nowIso = new Date().toISOString();
    const all = await getStore().list("social_posts", { where: { slot_at: { gte: before, lt: nowIso } }, order: ["slot_at", "asc"] });
    const posts = all.filter((p) => p.slot_at >= since);
    const earlier = all.filter((p) => p.slot_at < since);
    const FIELDS = ["impressions", "reactions", "comments", "shares", "saves", "clicks", "enquiries"];
    const totals = (list, enq) => {
      const t = { posts: list.length, posted: 0, with_metrics: 0 };
      for (const f of FIELDS) t[f] = 0;
      for (const p of list) {
        if (p.status === "posted") t.posted += 1;
        const m = p.metrics || {};
        if (Object.keys(m).some((x) => !["updated", "entered_by"].includes(x))) t.with_metrics += 1;
        for (const f of FIELDS) t[f] += Number(m[f]) || 0;
      }
      if (enq !== undefined) t.enquiries = Math.max(t.enquiries, enq);
      const engaged = t.reactions + t.comments + t.shares + t.saves + t.clicks;
      t.engagement_rate = t.impressions ? +((engaged / t.impressions) * 100).toFixed(2) : null;
      return t;
    };
    // Impressions per week and channel, oldest first (weeks start on Monday in EEC's time zone).
    const settings = await getSettings();
    const weekOf = (iso) => mondayOf(localParts(new Date(iso), settings.timezone).date);
    const firstWeek = mondayOf(localParts(new Date(since), settings.timezone).date);
    const byWeek = [];
    for (let w = firstWeek; w <= weekOf(nowIso); w = addDays(w, 7)) byWeek.push({ week: w, posts: 0, impressions: 0, by_channel: {} });
    for (const p of posts) {
      const row = byWeek.find((r) => r.week === weekOf(p.slot_at));
      if (!row || p.status !== "posted") continue;
      const imp = Number((p.metrics || {}).impressions) || 0;
      row.posts += 1;
      row.impressions += imp;
      row.by_channel[p.channel] = (row.by_channel[p.channel] || 0) + imp;
    }
    const group = (key) => {
      const out = {};
      for (const p of posts) {
        const k = p[key] || "other";
        const o = (out[k] = out[k] || { posts: 0, posted: 0, missed: 0, failed: 0, dropped: 0, impressions: 0, reactions: 0, comments: 0, shares: 0, saves: 0, clicks: 0, enquiries: 0, with_metrics: 0, best: null });
        o.posts += 1;
        const imp = Number((p.metrics || {}).impressions) || 0;
        if (p.status === "posted" && imp && (!o.best || imp > o.best.impressions)) o.best = { post_id: p.post_id, topic: p.topic, impressions: imp };
        if (o[p.status] !== undefined) o[p.status] += 1;
        const m = p.metrics || {};
        if (Object.keys(m).some((x) => !["updated", "entered_by"].includes(x))) o.with_metrics += 1;
        for (const f of ["impressions", "reactions", "comments", "shares", "saves", "clicks", "enquiries"]) o[f] += Number(m[f]) || 0;
      }
      return out;
    };
    const extra = await data.insightsExtra(posts);
    const enqNow = Object.values(extra.per_post || {}).reduce((n, x) => n + x.enquiries, 0);
    const prevExtra = earlier.length ? await data.insightsExtra(earlier).catch(() => ({ per_post: {} })) : { per_post: {} };
    const enqBefore = Object.values(prevExtra.per_post || {}).reduce((n, x) => n + x.enquiries, 0);
    res.json({
      weeks,
      totals: totals(posts, enqNow),
      previous: totals(earlier, enqBefore),
      by_week: byWeek,
      by_format_group: group("format"),
      outreach: await outreach.stats(new Date(), weeks * 7).catch(() => null),
      outreach_previous: await outreach.stats(new Date(Date.now() - span), weeks * 7).catch(() => null),
      by_channel: group("channel"),
      by_pillar: group("pillar"),
      by_series: group("series"),
      ...extra,
      posts: posts.filter((p) => p.status === "posted").map(decorate),
    });
  })
);

router.get(
  "/studio/learning",
  auth,
  asyncHandler(async (req, res) => {
    const store = getStore();
    res.json({
      rules: await store.list("social_preferences", { order: ["id", "asc"] }),
      learning: await store.list("social_learning", { order: ["created_at", "desc"], limit: 100 }),
      research: await store.list("social_research", { order: ["found_at", "desc"], limit: 60 }),
    });
  })
);

router.post(
  "/studio/rules/:id",
  auth,
  asyncHandler(async (req, res) => {
    service.requireRole(req.member, ["approver", "editor"]);
    const status = (req.body || {}).status;
    const text = (req.body || {}).rule_text;
    if (status && !["active", "candidate", "retired"].includes(status)) throw new HttpError(422, "Unknown status");
    const patch = { updated_at: new Date().toISOString() };
    if (status) Object.assign(patch, { status, decided_by: req.member.email, decided_at: patch.updated_at, decision_note: (req.body || {}).note || null });
    if (typeof text === "string" && text.trim()) patch.rule_text = text.trim().slice(0, 1500);
    const [row] = await getStore().update("social_preferences", { id: Number(req.params.id) }, patch);
    if (!row) throw new HttpError(404, "Rule not found");
    await audit(req.member.email, "rule.updated", req.params.id, patch);
    res.json(row);
  })
);

router.post(
  "/studio/rules",
  auth,
  asyncHandler(async (req, res) => {
    service.requireRole(req.member, ["approver", "editor"]);
    const b = req.body || {};
    if (!b.rule_text || !b.rule_type) throw new HttpError(422, "Rule type and text are required.");
    const [row] = await getStore().insert("social_preferences", {
      approver: req.member.name,
      channel: b.channel || "all",
      rule_type: String(b.rule_type).slice(0, 40),
      rule_text: String(b.rule_text).slice(0, 1500),
      domain: learning.domainFor(b.rule_type, b.domain),
      decided_by: req.member.email,
      decided_at: new Date().toISOString(),
      status: "active",
      evidence_count: 1,
      source: `added on the Studio page by ${req.member.email}`,
      updated_at: new Date().toISOString(),
    });
    await audit(req.member.email, "rule.added", String(row.id), { text: row.rule_text });
    res.json(row);
  })
);

router.get(
  "/studio/health",
  auth,
  asyncHandler(async (req, res) => {
    const store = getStore();
    const settings = await getSettings();
    const t = new Date().toISOString();
    const [failed, waiting, upcoming, audit_log, members] = await Promise.all([
      store.list("social_posts", { where: { status: { in: ["failed"] } }, order: ["updated_at", "desc"], limit: 20 }),
      store.list("social_posts", { where: { status: { in: ["pending", "changes_requested"] } } }),
      store.list("social_posts", { where: { status: { in: ["approved", "scheduled"] }, slot_at: { gte: t } }, order: ["slot_at", "asc"], limit: 20 }),
      store.list("social_audit", { order: ["at", "desc"], limit: 60 }),
      store.list("social_members", { order: ["role", "asc"] }),
    ]);
    res.json({
      settings: Object.fromEntries(Object.keys(DEFAULTS).filter((k) => k !== "tone_reference").map((k) => [k, settings[k]])),
      last_tick: settings.last_tick || null,
      last_tick_summary: settings.last_tick_summary || null,
      buffer_key_set: Boolean(process.env.BUFFER_API_KEY),
      agent_key_set: Boolean(process.env.SOCIAL_AGENT_KEY),
      cron_secret_set: Boolean(process.env.CRON_SECRET),
      failed: failed.map(decorate),
      waiting_count: waiting.length,
      upcoming: upcoming.map(decorate),
      audit: audit_log,
      members,
    });
  })
);

// Lists Buffer channels so they can be mapped to EEC channels.
router.get(
  "/studio/buffer/channels",
  auth,
  asyncHandler(async (req, res) => {
    service.requireRole(req.member, ["approver", "editor"]);
    const buffer = getBuffer();
    const orgs = await buffer.organizations();
    if (!orgs.length) throw new HttpError(404, "No Buffer organization found for this API key.");
    const settings = await getSettings();
    const org = orgs.find((o) => o.id === settings.buffer_organization_id) || orgs[0];
    if (org.id !== settings.buffer_organization_id) await setSetting("buffer_organization_id", org.id, req.member.email);
    res.json({ organization: org, organizations: orgs, channels: await buffer.channels(org.id), mapping: settings.buffer_channels });
  })
);

const SETTINGS_BY_ROLE = {
  approver: ["cadence", "reminders", "late_window_hours", "notify_email", "report_recipients", "buffer_channels", "content_scope", "services", "audience_split", "dry_run", "tone_reference", "outreach"],
  editor: ["cadence", "reminders", "notify_email", "report_recipients", "buffer_channels", "outreach"],
};
router.post(
  "/studio/settings",
  auth,
  asyncHandler(async (req, res) => {
    const { key, value } = req.body || {};
    const allowed = SETTINGS_BY_ROLE[req.member.role] || [];
    if (!allowed.includes(key)) throw new HttpError(403, `Your role cannot change "${key}".`);
    if (key === "cadence") {
      const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
      for (const [ch, c] of Object.entries(value || {})) {
        if (!service.CHANNELS.includes(ch) || !Array.isArray(c.days) || !c.days.every((d) => days.includes(d)) || !/^\d{2}:\d{2}$/.test(c.time || "")) {
          throw new HttpError(422, `Cadence for ${ch} is not valid.`);
        }
      }
    }
    if (key === "dry_run" && typeof value !== "boolean") throw new HttpError(422, "dry_run must be true or false.");
    if (key === "outreach") {
      const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
      const v = value || {};
      if (!Array.isArray(v.days) || !v.days.every((d) => days.includes(d))) throw new HttpError(422, "Outreach days are not valid.");
      if (!(Number(v.per_run) >= 1 && Number(v.per_run) <= 30)) throw new HttpError(422, "Comments per run must be between 1 and 30.");
    }
    await setSetting(key, value, req.member.email);
    await audit(req.member.email, "setting.changed", key, { value: key === "tone_reference" ? "(text)" : value });
    res.json({ ok: true });
  })
);

router.post(
  "/studio/members",
  auth,
  asyncHandler(async (req, res) => {
    service.requireRole(req.member, ["approver"]);
    const { email, name, role, active = true } = req.body || {};
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email || "")) throw new HttpError(422, "Enter a valid email.");
    if (!["approver", "editor", "viewer"].includes(role)) throw new HttpError(422, "Role must be approver, editor or viewer.");
    const store = getStore();
    const key = email.toLowerCase();
    if (key === req.member.email.toLowerCase() && (role !== "approver" || !active)) {
      const others = (await store.list("social_members", { where: { role: "approver", active: true } })).filter((m) => m.email !== key);
      if (!others.length) throw new HttpError(409, "Add another approver before you step down, so someone can still approve.");
    }
    const [row] = await store.upsert("social_members", { email: key, name: name || key, role, active: Boolean(active) });
    await audit(req.member.email, "member.saved", key, { role, active });
    res.json(row);
  })
);

router.post(
  "/studio/run-tick",
  auth,
  asyncHandler(async (req, res) => {
    service.requireRole(req.member, ["approver", "editor"]);
    res.json(await tick({ force: Boolean((req.body || {}).force) }));
  })
);

module.exports = router;
