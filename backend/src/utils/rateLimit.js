// Minimal in-memory sliding-window rate limiter, keyed by client IP.
// Best-effort only: on serverless hosts each warm instance keeps its own counters,
// so this slows down abuse but is not a hard global limit.
const buckets = new Map();

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded) return forwarded.split(",")[0].trim();
  return req.ip || (req.socket && req.socket.remoteAddress) || "unknown";
}

// Returns true when the request is allowed, false when `key` exceeded `max` hits in `windowMs`.
function allow(key, max, windowMs, now = Date.now()) {
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (!v.some((t) => now - t < windowMs)) buckets.delete(k);
    }
  }
  return true;
}

module.exports = { allow, clientIp };
