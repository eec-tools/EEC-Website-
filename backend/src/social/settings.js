// Reads social_config with the seed values as defaults, so a missing row never breaks a job.
const { getStore } = require("./store");
const seed = require("./seedData");

const DEFAULTS = Object.fromEntries(seed.config.map(([k, v]) => [k, v]));

async function getSettings() {
  const rows = await getStore().list("social_config");
  const out = { ...DEFAULTS };
  for (const r of rows) out[r.key] = r.value;
  return out;
}

async function setSetting(key, value, actor) {
  if (!(key in DEFAULTS) && !["last_daily_run", "last_tick", "last_tick_summary"].includes(key)) {
    throw new Error(`Unknown setting "${key}"`);
  }
  await getStore().upsert("social_config", { key, value, updated_by: actor, updated_at: new Date().toISOString() });
}

async function audit(actor, action, target, detail = {}) {
  try {
    await getStore().insert("social_audit", { actor, action, target, detail, at: new Date().toISOString() });
  } catch (e) {
    // Auditing must never break the action itself.
    require("../utils/logger").warning(`social audit write failed: ${e.message}`);
  }
}

module.exports = { getSettings, setSetting, audit, DEFAULTS };
