// Public enquiry forms from the October 2026 launch brief. No login required.
//   POST /api/service-requests/buyer     Form A: Buyer Service Request (multipart, optional documents)
//   POST /api/service-requests/supplier  Form B: Supplier Export Readiness Application (JSON)
const express = require("express");
const multer = require("multer");
const asyncHandler = require("../middleware/asyncHandler");
const HttpError = require("../utils/httpError");
const { MAX_UPLOAD_BYTES, MAX_UPLOAD_MB } = require("../config/uploadLimits");
const {
  buyerServiceRequestSchema,
  supplierExportApplicationSchema,
} = require("../validation/schemas");
const { handleSubmission } = require("../services/serviceRequestService");

const MAX_FILES = 3;
const ALLOWED_EXTENSIONS = new Set(["pdf", "doc", "docx", "xls", "xlsx", "csv", "png", "jpg", "jpeg", "webp"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: MAX_FILES, fields: 40 },
});

const router = express.Router();

// Hidden "fax_number" field: real visitors never see or fill it, simple bots do.
function isBot(body) {
  return typeof body.fax_number === "string" && body.fax_number.trim() !== "";
}

function failIfNothingReachedEec(result) {
  if (!result.notified && !result.logged) {
    throw new HttpError(
      502,
      "We could not submit your request right now. Please try again, or email partners@eectrade.com."
    );
  }
}

router.post(
  "/service-requests/buyer",
  upload.array("supporting_documents", MAX_FILES),
  asyncHandler(async (req, res) => {
    if (isBot(req.body)) return res.json({ reference: null, ok: true });

    const files = req.files || [];
    for (const f of files) {
      const ext = (f.originalname.split(".").pop() || "").toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        throw new HttpError(400, `Files of type .${ext} are not accepted. Use PDF, Word, Excel or image files.`);
      }
    }
    const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
    if (totalBytes > MAX_UPLOAD_BYTES) {
      throw new HttpError(400, `Supporting documents must be ${MAX_UPLOAD_MB} MB or less in total.`);
    }

    const data = buyerServiceRequestSchema.parse(req.body);
    const result = await handleSubmission("buyer", data, files);
    failIfNothingReachedEec(result);
    res.json({ ok: true, reference: result.reference, confirmation_sent: result.confirmationSent });
  })
);

router.post(
  "/service-requests/supplier",
  asyncHandler(async (req, res) => {
    if (isBot(req.body || {})) return res.json({ reference: null, ok: true });

    const data = supplierExportApplicationSchema.parse(req.body || {});
    const result = await handleSubmission("supplier", data);
    failIfNothingReachedEec(result);
    res.json({ ok: true, reference: result.reference, confirmation_sent: result.confirmationSent });
  })
);

module.exports = router;
