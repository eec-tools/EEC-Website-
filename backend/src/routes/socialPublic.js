// Endpoints that are not called by a logged-in person:
//   GET  /api/social/media/:postId/:version/:n.jpg   slide images (Buffer and the Studio page load these)
//   GET|POST /api/social/cron                        the clock (Vercel cron / GitHub Actions)
//   POST /api/social/mcp/:key                        connector for Claude's scheduled tasks
const express = require("express");
const crypto = require("crypto");
const asyncHandler = require("../middleware/asyncHandler");
const { getStore } = require("../social/store");
const { renderSlide } = require("../social/slides");
const { tick } = require("../social/tick");
const { handleRpc } = require("../social/mcp");
const logger = require("../utils/logger");

const router = express.Router();

function safeEqual(a, b) {
  const x = Buffer.from(String(a || ""));
  const y = Buffer.from(String(b || ""));
  return x.length === y.length && x.length >= 24 && crypto.timingSafeEqual(x, y);
}

router.get(
  "/social/media/:postId/:version/:n.jpg",
  asyncHandler(async (req, res) => {
    const post = await getStore().get("social_posts", req.params.postId);
    const version = Number(req.params.version);
    const n = Number(req.params.n);
    if (!post || !Number.isInteger(n) || n < 1) return res.status(404).end();
    let slides = post.slides;
    if (post.version !== version) {
      const v = await getStore().list("social_post_versions", { where: { post_id: post.post_id, version } });
      if (!v.length) return res.status(404).end();
      slides = v[0].slides;
    }
    if (!slides || n > slides.length) return res.status(404).end();
    const jpg = await renderSlide(slides, n - 1);
    res.set("Content-Type", "image/jpeg");
    // A version's slides never change, so the URL can be cached for good.
    res.set("Cache-Control", "public, max-age=31536000, immutable");
    res.set("Cross-Origin-Resource-Policy", "cross-origin");
    res.send(jpg);
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
