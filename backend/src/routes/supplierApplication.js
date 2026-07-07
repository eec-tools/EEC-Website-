const express = require("express");
const repos = require("../repositories");
const asyncHandler = require("../middleware/asyncHandler");
const { requireAuth } = require("../middleware/requireAuth");
const ids = require("../utils/ids");
const { supplierApplicationSchema } = require("../validation/schemas");

const router = express.Router();

router.post(
  "/supplier/application",
  requireAuth,
  asyncHandler(async (req, res) => {
    const payload = supplierApplicationSchema.parse(req.body);

    const record = {
      application_id: ids.genApplicationId(),
      user_id: req.user.user_id,
      ...payload,
      status: "pending_review",
      created_at: new Date().toISOString(),
    };
    const created = await repos.supplierApplications.create(record);
    res.json(created);
  })
);

router.get(
  "/supplier/applications",
  requireAuth,
  asyncHandler(async (req, res) => {
    const rows =
      req.user.role === "admin"
        ? await repos.supplierApplications.listAll()
        : await repos.supplierApplications.listForUser(req.user.user_id);
    res.json(rows);
  })
);

module.exports = router;
