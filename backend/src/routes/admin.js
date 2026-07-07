const express = require("express");
const repos = require("../repositories");
const storageService = require("../services/storageService");
const asyncHandler = require("../middleware/asyncHandler");
const { requireAuth } = require("../middleware/requireAuth");
const HttpError = require("../utils/httpError");
const logger = require("../utils/logger");

const router = express.Router();

function requireAdmin(req) {
  if (req.user.role !== "admin") throw new HttpError(403, "Admin only");
}

router.get(
  "/admin/users",
  requireAuth,
  asyncHandler(async (req, res) => {
    requireAdmin(req);

    const users = await repos.users.listAll();
    const userIds = users.map((u) => u.user_id);

    const [appCounts, intakeCounts, fileCounts] = await Promise.all([
      repos.supplierApplications.countByUserIds(userIds),
      repos.buyerIntakes.countByUserIds(userIds),
      repos.files.countManyByUserIds(userIds),
    ]);

    const annotated = users.map((u) => ({
      ...u,
      supplier_applications: appCounts[u.user_id] || 0,
      buyer_intakes: intakeCounts[u.user_id] || 0,
      files: fileCounts[u.user_id] || 0,
    }));

    res.json(annotated);
  })
);

router.delete(
  "/admin/users/:user_id",
  requireAuth,
  asyncHandler(async (req, res) => {
    requireAdmin(req);
    const { user_id: userId } = req.params;

    if (userId === req.user.user_id) throw new HttpError(400, "Cannot delete your own account");

    const target = await repos.users.findById(userId);
    if (!target) throw new HttpError(404, "User not found");
    if (target.role === "admin") throw new HttpError(400, "Cannot delete another admin account");

    const files = await repos.files.listByUserId(userId);
    let s3Deleted = 0;
    let localDeleted = 0;
    for (const file of files) {
      try {
        await storageService.deleteObject(file.storage_path);
        if (file.storage_path.startsWith("local://")) localDeleted += 1;
        else s3Deleted += 1;
      } catch (e) {
        logger.warning(`Storage delete failed for ${file.storage_path}: ${e.message}`);
      }
    }

    const supplierApplicationsDeleted = (await repos.supplierApplications.deleteByUserId(userId)).deletedCount;
    const buyerIntakesDeleted = (await repos.buyerIntakes.deleteByUserId(userId)).deletedCount;
    const filesDeleted = (await repos.files.deleteByUserId(userId)).deletedCount;
    const userDeleted = (await repos.users.deleteById(userId)).deletedCount;

    const deleted = {
      user: userDeleted,
      supplier_applications: supplierApplicationsDeleted,
      buyer_intakes: buyerIntakesDeleted,
      files: filesDeleted,
      s3_objects_deleted: s3Deleted,
      local_files_deleted: localDeleted,
    };
    logger.info(`Admin ${req.user.email} deleted user ${userId} (${target.email}): ${JSON.stringify(deleted)}`);
    res.json({ ok: true, user_id: userId, deleted });
  })
);

module.exports = router;
