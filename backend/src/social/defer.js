// Runs work after the HTTP response has been sent (Vercel keeps the function alive for it).
// Used so Approve answers at once while the post goes to Buffer in the background.
const logger = require("../utils/logger");

let waitUntil = null;
try {
  ({ waitUntil } = require("@vercel/functions"));
} catch (e) {
  waitUntil = null;
}

const pending = new Set();

function defer(fn, label = "background task") {
  const p = Promise.resolve()
    .then(fn)
    .catch((e) => logger.warning(`social: ${label} failed: ${e.message}`));
  pending.add(p);
  p.finally(() => pending.delete(p));
  if (waitUntil && process.env.VERCEL) {
    try {
      waitUntil(p);
    } catch (e) {
      /* outside a request: the promise still runs */
    }
  }
  return p;
}

// Tests wait for background work with this.
async function settle() {
  while (pending.size) await Promise.all([...pending]);
}

module.exports = { defer, settle };
