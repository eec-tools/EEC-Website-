const config = require("../config/env");
const repos = require("../repositories");
const checkConnection = require("../db/checkConnection");
const logger = require("../utils/logger");
const seedAdmin = require("./seedAdmin");
const storageService = require("../services/storageService");

async function bootstrap() {
  if (config.useInMemoryDb) {
    logger.info("Using in-memory database for local development");
    repos.setMode("memory");
  } else {
    try {
      await checkConnection();
      repos.setMode("postgres");
      logger.info("Connected to Supabase Postgres");
    } catch (e) {
      logger.warning(`Supabase unavailable, using in-memory fallback: ${e.message}`);
      repos.setMode("memory");
    }
  }

  await seedAdmin();
  storageService.initStorage();
}

module.exports = bootstrap;
