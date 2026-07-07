const express = require("express");
const multer = require("multer");
const repos = require("../repositories");
const storageService = require("../services/storageService");
const asyncHandler = require("../middleware/asyncHandler");
const { requireAuth } = require("../middleware/requireAuth");
const HttpError = require("../utils/httpError");
const config = require("../config/env");
const ids = require("../utils/ids");
const { MAX_UPLOAD_BYTES } = require("../config/uploadLimits");

const ALLOWED_EXTENSIONS = new Set(["pdf", "png", "jpg", "jpeg", "webp", "doc", "docx"]);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_UPLOAD_BYTES } });

const router = express.Router();

router.post(
  "/upload",
  requireAuth,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, "No file provided");

    const docType = typeof req.query.doc_type === "string" ? req.query.doc_type : "general";

    const originalFilename = req.file.originalname || "file";
    const parts = originalFilename.split(".");
    const ext = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "bin";
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      throw new HttpError(400, `File type .${ext} not allowed`);
    }

    const fileId = ids.genFileId();
    const objectPath = `${config.appName}/uploads/${req.user.user_id}/${fileId}.${ext}`;
    const stored = await storageService.putObject(objectPath, req.file.buffer, req.file.mimetype);

    const record = {
      file_id: fileId,
      user_id: req.user.user_id,
      storage_path: stored.path,
      storage_provider: stored.provider,
      original_filename: originalFilename,
      content_type: req.file.mimetype,
      size: stored.size,
      doc_type: docType,
      is_deleted: false,
      created_at: new Date().toISOString(),
    };
    const created = await repos.files.create(record);
    res.json(created);
  })
);

module.exports = router;
