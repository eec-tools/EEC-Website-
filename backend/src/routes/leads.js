// Public contact form (/contact page). No login required.
//   POST /api/leads
// Spam protection: hidden honeypot field, minimum fill time, and a per-IP rate limit.
// Real visitors never see the honeypot ("fax_number") and take longer than MIN_FILL_MS to
// write a message, so bots that trip either check get a fake success and nothing is stored.
const express = require("express");
const repos = require("../repositories");
const asyncHandler = require("../middleware/asyncHandler");
const HttpError = require("../utils/httpError");
const ids = require("../utils/ids");
const logger = require("../utils/logger");
const config = require("../config/env");
const { allow, clientIp } = require("../utils/rateLimit");
const { sendMail } = require("../services/emailService");
const { contactLeadSchema } = require("../validation/schemas");

const MIN_FILL_MS = 3000;
const RATE_MAX = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;

const router = express.Router();

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

router.post(
  "/leads",
  asyncHandler(async (req, res) => {
    const body = req.body || {};

    // Honeypot filled in, or form submitted faster than a person could write it.
    const filledHoneypot = typeof body.fax_number === "string" && body.fax_number.trim() !== "";
    const elapsed = Number(body.elapsed_ms);
    const tooFast = !Number.isFinite(elapsed) || elapsed < MIN_FILL_MS;
    if (filledHoneypot || tooFast) return res.json({ ok: true, lead_id: null });

    if (!allow(`lead:${clientIp(req)}`, RATE_MAX, RATE_WINDOW_MS)) {
      throw new HttpError(429, "Too many messages from this connection. Please try again later or email us directly.");
    }

    const payload = contactLeadSchema.parse(body);
    const record = {
      lead_id: ids.genLeadId(),
      ...payload,
      created_at: new Date().toISOString(),
    };
    const created = await repos.leads.create(record);

    // Tell EEC about the message. A failed email must not lose a lead that is already stored.
    const rows = [
      ["Name", payload.name],
      ["Email", payload.email],
      ["Phone", payload.phone],
      ["Company", payload.company],
      ["Message", payload.message],
    ].filter(([, v]) => v);
    sendMail({
      to: config.serviceRequestNotifyEmail,
      replyTo: payload.email,
      subject: `New website contact message from ${payload.name} (${record.lead_id})`,
      text: `New message from the EEC website contact form.\nReference: ${record.lead_id}\n\n${rows
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n")}`,
      html:
        `<p>New message from the EEC website contact form.<br>Reference: ${escapeHtml(record.lead_id)}</p>` +
        `<table style="border-collapse:collapse;font-size:14px">${rows
          .map(
            ([k, v]) =>
              `<tr><td style="padding:4px 12px 4px 0;color:#6B7280;vertical-align:top">${escapeHtml(k)}</td>` +
              `<td style="padding:4px 0;white-space:pre-wrap">${escapeHtml(v)}</td></tr>`
          )
          .join("")}</table>`,
    }).catch((e) => logger.error(`Contact notification failed: ${e.message}`));

    res.json({ ok: true, lead_id: created.lead_id });
  })
);

module.exports = router;
