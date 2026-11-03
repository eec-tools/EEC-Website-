// The clock. Called every 15 minutes (GitHub Actions) and once a day (Vercel cron).
// Every step is idempotent, so extra calls are harmless.

const logger = require("../utils/logger");
const { getStore } = require("./store");
const { getSettings, setSetting, audit } = require("./settings");
const { getBuffer } = require("./buffer");
const service = require("./service");
const notify = require("./notify");
const { inQuietHours, localParts } = require("./time");

async function syncSent(summary) {
  const store = getStore();
  const t = service.now();
  // Buffer publishes on the minute; check from one minute after the slot.
  const due = await store.list("social_posts", { where: { status: "scheduled", slot_at: { lte: new Date(t.getTime() - 60000).toISOString() } } });
  for (const p of due) {
    if (service.isDryRunId(p.buffer_id)) {
      await store.update("social_posts", { post_id: p.post_id, status: "scheduled" }, {
        status: "dropped",
        error: "Dry run: this post was never sent to Buffer.",
        updated_at: t.toISOString(),
      });
      summary.dry_run_closed.push(p.post_id);
      await service.refreshBatchStatus(p.batch_id);
      continue;
    }
    try {
      const bp = await getBuffer().getPost(p.buffer_id);
      if (!bp) {
        // Deleted in Buffer by someone, so it will never be published from there.
        await store.update("social_posts", { post_id: p.post_id, status: "scheduled" }, {
          status: "dropped",
          error: "This post was deleted in Buffer, so it was not published.",
          updated_at: t.toISOString(),
        });
        await audit("system", "post.deleted_in_buffer", p.post_id, { buffer_id: p.buffer_id });
        await service.refreshBatchStatus(p.batch_id);
        continue;
      }
      if (bp.status === "sent") {
        await store.update("social_posts", { post_id: p.post_id, status: "scheduled" }, {
          status: "posted",
          posted_at: bp.sentAt || t.toISOString(),
          external_url: bp.externalLink || null,
          error: null,
          updated_at: t.toISOString(),
        });
        summary.posted.push(p.post_id);
        await audit("system", "post.posted", p.post_id, { url: bp.externalLink || null });
        await service.refreshBatchStatus(p.batch_id);
      } else if (bp.status === "error") {
        await store.update("social_posts", { post_id: p.post_id, status: "scheduled" }, {
          status: "failed",
          error: "Buffer could not publish this post. Open Buffer to see why (often a disconnected channel or a rejected image).",
          updated_at: t.toISOString(),
        });
        summary.failed.push(p.post_id);
        await service.alert("a post failed to publish", `<p>${notify.esc(p.topic)} (${notify.esc(notify.CHANNEL_NAMES[p.channel])}) failed in Buffer.</p>`);
      } else if (Date.parse(p.slot_at) < t.getTime() - 2 * 3600000 && !(p.error || "").startsWith("Still waiting")) {
        await store.update("social_posts", { post_id: p.post_id }, { error: `Still waiting in Buffer (status ${bp.status}) 2 hours after its time.` });
        await service.alert("a post is stuck in Buffer", `<p>${notify.esc(p.topic)} is still ${notify.esc(bp.status)} in Buffer 2 hours after its time.</p>`);
      }
    } catch (e) {
      summary.errors.push(`sync ${p.post_id}: ${e.message}`);
    }
  }
}

async function scheduleApproved(summary, settings) {
  if (settings.dry_run || !settings.publishing_enabled) return;
  const waiting = await getStore().list("social_posts", { where: { status: "approved", buffer_id: { is: null } }, order: ["slot_at", "asc"] });
  for (const p of waiting) {
    const r = await service.schedulePost(p.post_id);
    if (r && r.status === "scheduled") summary.scheduled.push(p.post_id);
  }
}

async function markMissed(summary, settings) {
  const store = getStore();
  const t = service.now();
  const cutoff = new Date(t.getTime() - (Number(settings.late_window_hours) || 6) * 3600000).toISOString();
  const late = await store.list("social_posts", { where: { status: { in: ["pending", "changes_requested"] }, slot_at: { lt: cutoff } } });
  for (const p of late) {
    const [m] = await store.update("social_posts", { post_id: p.post_id, status: p.status }, {
      status: "missed",
      error: "Not approved in time. The slot was skipped; nothing was posted.",
      updated_at: t.toISOString(),
    });
    if (m) {
      summary.missed.push(m);
      await audit("system", "post.missed", p.post_id, { reason: "not approved in time" });
      await service.refreshBatchStatus(p.batch_id);
    }
  }
  if (summary.missed.length) {
    await service.alert(
      `${summary.missed.length} post(s) missed their slot`,
      `<p>These were not approved within ${settings.late_window_hours} hours of their time, so they were skipped.</p>${notify.postTable(summary.missed, settings.timezone)}`
    );
  }
  summary.missed = summary.missed.map((m) => m.post_id);
}

async function remind(summary, settings) {
  const r = settings.reminders || {};
  if (!r.enabled) return;
  const t = service.now();
  if (inQuietHours(t, settings.timezone, r.quiet_hours)) return;
  const store = getStore();
  const horizon = new Date(t.getTime() + (Number(r.start_hours_before) || 48) * 3600000).toISOString();
  const waiting = await store.list("social_posts", {
    where: { status: "pending", slot_at: { gt: t.toISOString(), lte: horizon } },
    order: ["slot_at", "asc"],
  });
  const intervalMs = (Number(r.interval_hours) || 2) * 3600000;
  const due = waiting.filter((p) => {
    const since = p.last_reminder_at ? Date.parse(p.last_reminder_at) : Date.parse(p.updated_at || p.created_at || 0);
    return t.getTime() - since >= intervalMs;
  });
  if (!due.length) return;
  const sent = await notify.send(
    await notify.approverEmails(),
    `EEC Social: ${waiting.length} post(s) waiting for your approval`,
    notify.wrap(
      "Posts are waiting for your approval",
      `<p>The earliest goes out ${notify.esc(notify.whenLocal(waiting[0].slot_at, settings.timezone))} IST. Anything not approved within ${settings.late_window_hours} hours of its time is skipped.</p>${notify.postTable(waiting, settings.timezone)}<p><a href="${notify.studioUrl("?tab=pending")}">Approve now</a></p>`
    )
  );
  if (sent) {
    for (const p of due) {
      await store.update("social_posts", { post_id: p.post_id }, { last_reminder_at: t.toISOString(), reminder_count: (p.reminder_count || 0) + 1 });
    }
    summary.reminded = due.length;
  }
}

async function daily(summary, settings) {
  const t = service.now();
  const today = localParts(t, settings.timezone).date;
  if (settings.last_daily_run === today) return;
  const store = getStore();
  const problems = [];

  // Channel health.
  if (process.env.BUFFER_API_KEY && settings.buffer_organization_id) {
    try {
      const channels = await getBuffer().channels(settings.buffer_organization_id);
      const mapped = settings.buffer_channels || {};
      for (const [key, id] of Object.entries(mapped)) {
        if (!id) continue;
        const ch = channels.find((c) => c.id === id);
        if (!ch) problems.push(`${notify.CHANNEL_NAMES[key]}: the mapped Buffer channel no longer exists.`);
        else if (ch.isDisconnected) problems.push(`${notify.CHANNEL_NAMES[key]}: disconnected in Buffer. Reconnect it in Buffer.`);
        else if (ch.isLocked) problems.push(`${notify.CHANNEL_NAMES[key]}: locked in Buffer (plan limit).`);
        else if (ch.isQueuePaused) problems.push(`${notify.CHANNEL_NAMES[key]}: queue is paused in Buffer.`);
      }
    } catch (e) {
      problems.push(`Could not reach Buffer: ${e.message}`);
    }
  }

  // Metrics for posts from the last 30 days.
  if (process.env.BUFFER_API_KEY && !settings.dry_run) {
    const since = new Date(t.getTime() - 30 * 86400000).toISOString();
    const posted = await store.list("social_posts", { where: { status: "posted", posted_at: { gte: since } } });
    for (const p of posted) {
      if (!p.buffer_id || service.isDryRunId(p.buffer_id)) continue;
      try {
        const { metrics } = await getBuffer().getPostMetrics(p.buffer_id);
        if (Object.keys(metrics).length) {
          await store.insert("social_metrics", { post_id: p.post_id, source: "buffer", metrics, captured_at: t.toISOString() });
          await store.update("social_posts", { post_id: p.post_id }, { metrics: { ...(p.metrics || {}), ...metrics, updated: t.toISOString() } });
          summary.metrics += 1;
        }
      } catch (e) {
        summary.errors.push(`metrics ${p.post_id}: ${e.message}`);
      }
    }
  }

  // Batches nobody has looked at.
  const stale = await store.list("social_batches", { where: { status: "pending", created_at: { lt: new Date(t.getTime() - 36 * 3600000).toISOString() } } });
  if (stale.length) problems.push(`${stale.length} batch(es) have waited more than 36 hours with nothing approved.`);
  if (settings.dry_run) problems.push("Dry run is ON: approved posts are not sent to Buffer. Turn it off at go-live.");
  if (!settings.publishing_enabled) problems.push("Publishing is PAUSED.");

  if (problems.length) {
    await service.alert("daily health check", `<ul>${problems.map((p) => `<li>${notify.esc(p)}</li>`).join("")}</ul>`);
  }
  summary.health = problems;
  await setSetting("last_daily_run", today, "system");
}

async function tick({ force = false } = {}) {
  const summary = { at: service.now().toISOString(), scheduled: [], posted: [], failed: [], missed: [], dry_run_closed: [], reminded: 0, metrics: 0, health: [], errors: [] };
  const settings = await getSettings();
  const steps = [
    ["syncSent", () => syncSent(summary)],
    ["scheduleApproved", () => scheduleApproved(summary, settings)],
    ["markMissed", () => markMissed(summary, settings)],
    ["remind", () => remind(summary, settings)],
    ["daily", () => daily(summary, force ? { ...settings, last_daily_run: null } : settings)],
  ];
  for (const [name, fn] of steps) {
    try {
      await fn();
    } catch (e) {
      summary.errors.push(`${name}: ${e.message}`);
      logger.error(`social tick ${name}: ${e.stack || e.message}`);
    }
  }
  try {
    await setSetting("last_tick", summary.at, "system");
    await setSetting("last_tick_summary", summary, "system");
  } catch (e) {
    summary.errors.push(`save tick: ${e.message}`);
  }
  return summary;
}

// A light, fast sync run whenever someone opens or refreshes the Studio, so statuses are right
// on time even if the outside clock is late. At most one run at a time, and not more than every 20 seconds.
let quickRunning = null;
let lastQuick = 0;
async function quickSync({ minGapMs = 20000 } = {}) {
  if (quickRunning) return quickRunning;
  if (Date.now() - lastQuick < minGapMs) return null;
  lastQuick = Date.now();
  quickRunning = (async () => {
    const summary = { at: service.now().toISOString(), scheduled: [], posted: [], failed: [], missed: [], dry_run_closed: [], reminded: 0, metrics: 0, health: [], errors: [] };
    const settings = await getSettings();
    for (const [name, fn] of [
      ["syncSent", () => syncSent(summary)],
      ["scheduleApproved", () => scheduleApproved(summary, settings)],
      ["markMissed", () => markMissed(summary, settings)],
    ]) {
      try {
        await fn();
      } catch (e) {
        summary.errors.push(`${name}: ${e.message}`);
      }
    }
    try {
      await setSetting("last_sync", summary.at, "system");
    } catch (e) {
      summary.errors.push(`save sync: ${e.message}`);
    }
    return summary;
  })().finally(() => {
    quickRunning = null;
  });
  return quickRunning;
}

module.exports = { tick, quickSync };
