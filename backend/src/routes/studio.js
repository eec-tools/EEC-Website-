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

const router = express.Router();

const member = asyncHandler(async (req, res, next) => {
  req.member = await service.memberFor(req.user);
  if (!req.member) throw new HttpError(403, "You do not have access to the Social Studio. Ask the approver to add your email.");
  next();
});
const auth = [requireAuth, member];

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
    res.json({
      member: req.member,
      timezone: settings.timezone,
      publishing_enabled: settings.publishing_enabled,
      dry_run: settings.dry_run,
      late_window_hours: settings.late_window_hours,
      // When a change requested now would be ready (next scheduled run plus a margin).
      change_ready_by: service.changeReadyBy(settings).toISOString(),
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
router.get("/studio/activity", auth, plain((req) => data.listActivity({ days: req.query.days })));
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
    const since = new Date(Date.now() - weeks * 7 * 86400000).toISOString();
    const posts = await getStore().list("social_posts", { where: { slot_at: { gte: since } }, order: ["slot_at", "asc"] });
    const group = (key) => {
      const out = {};
      for (const p of posts) {
        const k = p[key] || "other";
        const o = (out[k] = out[k] || { posts: 0, posted: 0, missed: 0, failed: 0, dropped: 0, impressions: 0, reactions: 0, comments: 0, shares: 0, saves: 0, clicks: 0, enquiries: 0, with_metrics: 0 });
        o.posts += 1;
        if (o[p.status] !== undefined) o[p.status] += 1;
        const m = p.metrics || {};
        if (Object.keys(m).some((x) => !["updated", "entered_by"].includes(x))) o.with_metrics += 1;
        for (const f of ["impressions", "reactions", "comments", "shares", "saves", "clicks", "enquiries"]) o[f] += Number(m[f]) || 0;
      }
      return out;
    };
    const extra = await data.insightsExtra(posts);
    res.json({
      weeks,
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
    if (status) patch.status = status;
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
  approver: ["cadence", "reminders", "late_window_hours", "notify_email", "report_recipients", "buffer_channels", "content_scope", "services", "audience_split", "dry_run", "tone_reference"],
  editor: ["cadence", "reminders", "notify_email", "report_recipients", "buffer_channels"],
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
