const multer = require("multer");
const { ZodError } = require("zod");
const HttpError = require("../utils/httpError");
const logger = require("../utils/logger");

function notFoundHandler(req, res) {
  res.status(404).json({ detail: "Not Found" });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ detail: err.detail });
  }
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ detail: "File too large (max 10MB)" });
    }
    return res.status(400).json({ detail: err.message });
  }
  if (err instanceof ZodError) {
    const detail = err.issues.map((i) => i.message).join(" ");
    return res.status(422).json({ detail: detail || "Invalid request" });
  }
  logger.error(`Unhandled error: ${err.stack || err}`);
  return res.status(500).json({ detail: "Internal server error" });
}

module.exports = { notFoundHandler, errorHandler };
