const config = require("../config/env");
const repos = require("../repositories");
const authService = require("../services/authService");
const logger = require("../utils/logger");
const ids = require("../utils/ids");

const LEGACY_ADMINS = ["admin@elanexports.com"];

async function seedAdmin() {
  if (!config.adminPassword) {
    logger.warning("ADMIN_PASSWORD is not configured; skipping admin seed");
    return;
  }

  try {
    const existing = await repos.users.findByEmail(config.adminEmail);
    if (!existing) {
      await repos.users.create({
        user_id: ids.genUserId(),
        email: config.adminEmail,
        password_hash: await authService.hashPassword(config.adminPassword),
        name: "EEC Admin",
        role: "admin",
        company: "Elan Exports Consultancy",
        picture: null,
        auth_provider: "local",
        created_at: new Date().toISOString(),
      });
      logger.info(`Admin seeded: ${config.adminEmail}`);
    } else {
      const patch = { role: "admin" };
      const verified = existing.password_hash
        ? await authService.verifyPassword(config.adminPassword, existing.password_hash)
        : false;
      if (!verified) {
        patch.password_hash = await authService.hashPassword(config.adminPassword);
      }
      await repos.users.updateByEmail(config.adminEmail, patch);
      logger.info(`Admin record ensured: ${config.adminEmail}`);
    }

    for (const legacy of LEGACY_ADMINS) {
      if (legacy === config.adminEmail) continue;
      const changed = await repos.users.demoteLegacyAdminByEmail(legacy);
      if (changed) logger.info(`Demoted legacy admin: ${legacy} -> buyer`);
    }
  } catch (e) {
    logger.error(`Admin seed error: ${e.stack || e}`);
  }
}

module.exports = seedAdmin;
