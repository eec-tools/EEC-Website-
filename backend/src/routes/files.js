const express = require("express");
const path = require("path");
const repos = require("../repositories");
const storageService = require("../services/storageService");
const asyncHandler = require("../middleware/asyncHandler");
const { requireAuth } = require("../middleware/requireAuth");
const HttpError = require("../utils/httpError");
const config = require("../config/env");

const router = express.Router();

function assertOwnerOrAdmin(record, user) {
  if (record.user_id !== user.user_id && user.role !== "admin") {
    throw new HttpError(403, "Not authorized to access this file");
  }
}

function rawFileUrl(req, fileId) {
  return `${req.protocol}://${req.get("host")}/api/files/${fileId}/raw`;
}

router.get(
  "/files/:file_id/download",
  requireAuth,
  asyncHandler(async (req, res) => {
    const record = await repos.files.findActiveById(req.params.file_id);
    if (!record) throw new HttpError(404, "File not found");
    assertOwnerOrAdmin(record, req.user);

    const doRedirect = req.query.redirect !== "false";

    if (record.storage_path.startsWith("local://")) {
      const url = rawFileUrl(req, record.file_id);
      if (doRedirect) return res.redirect(302, url);
      return res.json({ url, expires_in: 3600, file_id: record.file_id });
    }

    const url = await storageService.generatePresignedGetUrl(
      record.storage_path,
      record.original_filename,
      record.content_type,
      3600
    );
    if (doRedirect) return res.redirect(302, url);
    return res.json({ url, expires_in: 3600, file_id: record.file_id });
  })
);

router.get(
  "/files/:file_id/raw",
  requireAuth,
  asyncHandler(async (req, res) => {
    const record = await repos.files.findActiveById(req.params.file_id);
    if (!record) throw new HttpError(404, "File not found");
    assertOwnerOrAdmin(record, req.user);

    if (!record.storage_path.startsWith("local://")) {
      const url = await storageService.generatePresignedGetUrl(
        record.storage_path,
        record.original_filename,
        record.content_type,
        3600
      );
      return res.redirect(302, url);
    }

    const localPath = await storageService.readLocalFile(record.storage_path);
    res.type(record.content_type || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${record.original_filename}"`
    );
    res.sendFile(path.resolve(localPath));
  })
);

module.exports = router;
