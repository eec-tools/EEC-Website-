// Vercel serverless functions cap the incoming request body at 4.5MB — a hard
// platform limit, not something we can raise via config. Staying under it means
// uploads fail with our own clear error instead of an opaque Vercel-level 413.
const MAX_UPLOAD_MB = 4;
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

module.exports = { MAX_UPLOAD_MB, MAX_UPLOAD_BYTES };
