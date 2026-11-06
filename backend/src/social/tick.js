// The clock. Called every few minutes (cron-job.org or GitHub Actions) and once a day (Vercel cron).
// Every step is idempotent, so extra calls are harmless.

const logger = require("../utils/logger");
const { getStore } = require("./store");
const { getSettings, setSetting, audit } = require("./settings");
const { getBuffer } = require("./buffer");
const service = require("./service");
const notify = require("./notify");
const { localParts, zonedToUtc } = require("./time");

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

// One digest email at each reminder time (09:30 and 18:30 local by default), only while posts are
// waiting for approval. Each time is sent once, and only within 3 hours of it (a late clock does
// not send a stale reminder).
function timeLeft(ms) {
  const h = Math.round(ms / 3600000);
  if (ms < 3600000) return `${Math.max(1, Math.round(ms / 60000))} minutes`;
  if (h < 36) return `${h} hour${h === 1 ? "" : "s"}`;
  return `${Math.round(h / 24)} days`;
}

async function remind(summary, settings) {
  const r = settings.reminders || {};
  if (r.enabled === false) return;
  const tz = settings.timezone;
  const times = (Array.isArray(r.times) && r.times.length ? r.times : ["09:30", "18:30"]).slice().sort();
  const t = service.now();
  const today = localParts(t, tz).date;
  let slot = null;
  for (const hm of times) {
    const at = zonedToUtc(today, hm, tz).getTime();
    if (at <= t.getTime() && t.getTime() - at < 3 * 3600000) slot = `${today} ${hm}`;
  }
  if (!slot || settings.last_reminder_slot === slot) return;
  await setSetting("last_reminder_slot", slot, "system");

  const store = getStore();
  const lateMs = (Number(settings.late_window_hours) || 6) * 3600000;
  const waiting = await store.list("social_posts", {
    where: { status: "pending", slot_at: { gt: new Date(t.getTime() - lateMs).toISOString() } },
    order: ["slot_at", "asc"],
  });
  // Outreach comments ready to post (mentioned in the morning email; on their own they get a short email in the morning only).
  const outreachReady = await require("./outreach").readyCount().catch(() => 0);
  const morning = slot.endsWith(` ${times[0]}`);
  const outreachLine = outreachReady
    ? `<p>${outreachReady} LinkedIn comment${outreachReady === 1 ? " is" : "s are"} ready to post from the EEC page on the <a href="${notify.studioUrl("?tab=outreach")}">Outreach tab</a> (about 30 seconds each).</p>`
    : "";
  if (!waiting.length) {
    if (outreachReady && morning) {
      await notify.send(await notify.approverEmails(), `EEC Social: ${outreachReady} outreach comment${outreachReady === 1 ? "" : "s"} ready to post`, notify.wrap("Outreach comments ready", outreachLine));
    }
    return;
  }
  const row = (p) => {
    const until = Date.parse(p.slot_at) - t.getTime();
    const when = until > 0 ? `goes out in ${timeLeft(until)}` : `<b style="color:#a63a2e">past its time: approve within ${timeLeft(Date.parse(p.slot_at) + lateMs - t.getTime())} or it is skipped</b>`;
    const changed = p.change_request && p.change_request.state === "done" ? " · changed on your request" : "";
    return `<tr><td style="padding:6px 10px;border-bottom:1px solid #e3e6ee;white-space:nowrap">${notify.esc(notify.whenLocal(p.slot_at, tz))}</td><td style="padding:6px 10px;border-bottom:1px solid #e3e6ee">${notify.esc(notify.CHANNEL_NAMES[p.channel] || p.channel)}</td><td style="padding:6px 10px;border-bottom:1px solid #e3e6ee">${notify.esc(p.topic)}${changed}</td><td style="padding:6px 10px;border-bottom:1px solid #e3e6ee">${when}</td></tr>`;
  };
  const businessWaiting = await require("./learning").pendingBusiness().catch(() => 0);
  const businessLine = businessWaiting
    ? `<p>${businessWaiting} learning${businessWaiting === 1 ? "" : "s"} also wait${businessWaiting === 1 ? "s" : ""} for the business team to confirm or discard (<a href="${notify.studioUrl("?tab=learning")}">Learning</a> and <a href="${notify.studioUrl("?tab=competitors")}">Competitors</a> tabs).</p>`
    : "";
  const first = Date.parse(waiting[0].slot_at) - t.getTime();
  const sent = await notify.send(
    await notify.approverEmails(),
    `EEC Social: ${waiting.length} post${waiting.length === 1 ? "" : "s"} waiting for your approval (${first > 0 ? `first goes out in ${timeLeft(first)}` : "one is already past its time"})`,
    notify.wrap(
      "Posts waiting for your approval",
      `<table style="border-collapse:collapse;font-size:14px"><tr><th align="left" style="padding:6px 10px">When (IST)</th><th align="left" style="padding:6px 10px">Channel</th><th align="left" style="padding:6px 10px">Topic</th><th align="left" style="padding:6px 10px">Time left</th></tr>${waiting.map(row).join("")}</table><p>Anything not approved within ${settings.late_window_hours} hours of its time is skipped.</p>${businessLine}${morning ? outreachLine : ""}<p><a href="${notify.studioUrl("?tab=pending")}">Open the Studio</a></p>`
    )
  );
  if (sent) {
    for (const p of waiting) {
      await store.update("social_posts", { post_id: p.post_id }, { last_reminder_at: t.toISOString(), reminder_count: (p.reminder_count || 0) + 1 });
    }
    summary.reminded = waiting.length;
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

  // Social learnings the writer did not decide within a week are set aside (the team can undo it).
  try {
    summary.learning_set_aside = await require("./learning").expireSocial(t);
  } catch (e) {
    summary.errors.push(`learning: ${e.message}`);
  }

  // Outreach comments nobody posted within a few days are set aside (the post is no longer fresh).
  try {
    summary.outreach_expired = await require("./outreach").expire(t);
  } catch (e) {
    summary.errors.push(`outreach: ${e.message}`);
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
