const express = require("express");
const repos = require("../repositories");
const asyncHandler = require("../middleware/asyncHandler");
const { requireAuth } = require("../middleware/requireAuth");
const HttpError = require("../utils/httpError");
const ids = require("../utils/ids");
const { newsletterSubscribeSchema } = require("../validation/schemas");

const router = express.Router();

router.post(
  "/newsletter/subscribe",
  asyncHandler(async (req, res) => {
    const payload = newsletterSubscribeSchema.parse(req.body);
    const record = {
      subscriber_id: ids.genNewsletterSubscriberId(),
      email: payload.email.toLowerCase(),
      source_page: payload.source_page || null,
      submitted_at: new Date().toISOString(),
    };
    await repos.newsletterSubscribers.upsertByEmail(record);
    res.json({ ok: true });
  })
);

router.get(
  "/newsletter/subscribers",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") throw new HttpError(403, "Admin only");
    const rows = await repos.newsletterSubscribers.listAll();
    res.json(rows);
  })
);

module.exports = router;
