// Endpoints that are not called by a logged-in person:
//   GET  /api/social/media/:postId/:version/:n.jpg   slide images (Buffer and the Studio page load these)
//   GET  /api/social/media/:postId/:version/document.pdf   LinkedIn document posts (the slides as one PDF)
//   GET|POST /api/social/cron                        the clock (Vercel cron / GitHub Actions)
//   POST /api/social/mcp/:key                        connector for Claude's scheduled tasks
const express = require("express");
const crypto = require("crypto");
const asyncHandler = require("../middleware/asyncHandler");
const { getStore } = require("../social/store");
const { renderSlide } = require("../social/slides");
const { buildPdf } = require("../social/pdf");
const { tick } = require("../social/tick");
const { handleRpc } = require("../social/mcp");
const logger = require("../utils/logger");

const router = express.Router();

function safeEqual(a, b) {
  const x = Buffer.from(String(a || ""));
  const y = Buffer.from(String(b || ""));
  return x.length === y.length && x.length >= 24 && crypto.timingSafeEqual(x, y);
}

// A version's slides never change, so rendered images are cached for good: by the CDN (s-maxage)
// and in this instance's memory, so Buffer's download is fast.
const rendered = new Map();
async function slidesFor(postId, version) {
  const post = await getStore().get("social_posts", postId);
  if (!post) return null;
  if (post.version === version) return { post, slides: post.slides || [] };
  const v = await getStore().list("social_post_versions", { where: { post_id: post.post_id, version } });
  return v.length ? { post, slides: v[0].slides || [] } : null;
}
async function cachedSlide(postId, version, slides, i) {
  const key = `${postId}/${version}/${i}`;
  if (!rendered.has(key)) {
    if (rendered.size > 60) rendered.delete(rendered.keys().next().value);
    rendered.set(key, await renderSlide(slides, i));
  }
  return rendered.get(key);
}
const sendCached = (res, type, body) => {
  res.set("Content-Type", type);
  res.set("Cache-Control", "public, max-age=31536000, s-maxage=31536000, immutable");
  res.set("Cross-Origin-Resource-Policy", "cross-origin");
  res.send(body);
};

router.get(
  "/social/media/:postId/:version/document.pdf",
  asyncHandler(async (req, res) => {
    const version = Number(req.params.version);
    const found = Number.isInteger(version) ? await slidesFor(req.params.postId, version) : null;
    if (!found || !found.slides.length) return res.status(404).end();
    const pages = [];
    for (let i = 0; i < found.slides.length; i++) pages.push(await cachedSlide(req.params.postId, version, found.slides, i));
    sendCached(res, "application/pdf", buildPdf(pages, { title: found.post.topic }));
  })
);

router.get(
  "/social/media/:postId/:version/:n.jpg",
  asyncHandler(async (req, res) => {
    const version = Number(req.params.version);
    const n = Number(req.params.n);
    if (!Number.isInteger(n) || n < 1 || !Number.isInteger(version)) return res.status(404).end();
    const found = await slidesFor(req.params.postId, version);
    if (!found || n > found.slides.length) return res.status(404).end();
    sendCached(res, "image/jpeg", await cachedSlide(req.params.postId, version, found.slides, n - 1));
  })
);

const cron = asyncHandler(async (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : req.headers["x-cron-secret"];
  if (!process.env.CRON_SECRET || !safeEqual(token, process.env.CRON_SECRET)) return res.status(401).json({ detail: "Unauthorized" });
  const summary = await tick({ force: req.query.force === "1" });
  res.json(summary);
});
router.get("/social/cron", cron);
router.post("/social/cron", cron);

router.all(
  "/social/mcp/:key",
  asyncHandler(async (req, res) => {
    if (!process.env.SOCIAL_AGENT_KEY || !safeEqual(req.params.key, process.env.SOCIAL_AGENT_KEY)) {
      return res.status(404).json({ detail: "Not found" });
    }
    if (req.method === "GET") return res.status(405).set("Allow", "POST").end();
    if (req.method === "DELETE") return res.status(204).end();
    if (req.method !== "POST") return res.status(405).set("Allow", "POST").end();
    const body = req.body;
    const messages = Array.isArray(body) ? body : [body];
    const replies = [];
    for (const m of messages) {
      const r = await handleRpc(m);
      if (r) replies.push(r);
    }
    if (!replies.length) return res.status(202).end();
    logger.info(`social mcp: ${messages.map((m) => (m.method === "tools/call" ? `tools/call ${m.params && m.params.name}` : m.method)).join(", ")}`);
    res.json(Array.isArray(body) ? replies : replies[0]);
  })
);

module.exports = router;
