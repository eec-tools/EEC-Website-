// Vercel serverless entry point. Unlike `server.js` (used for local dev / a
// traditional long-running host), this never calls app.listen() — Vercel invokes
// this exported handler directly per request. `bootstrap()` (DB mode selection +
// admin seeding) is memoized so it only actually runs once per warm instance,
// not on every request.
const logger = require("../src/utils/logger");
const bootstrap = require("../src/bootstrap");
const buildApp = require("../src/app");

const app = buildApp();
let bootstrapPromise = null;

module.exports = async (req, res) => {
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrap().catch((err) => {
      bootstrapPromise = null; // allow the next invocation to retry
      throw err;
    });
  }

  try {
    await bootstrapPromise;
  } catch (err) {
    logger.error(`Bootstrap failed: ${err.stack || err}`);
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ detail: "Service temporarily unavailable" }));
    return;
  }

  return app(req, res);
};
