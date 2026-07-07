const express = require("express");
const repos = require("../repositories");
const asyncHandler = require("../middleware/asyncHandler");
const { requireAuth, tryResolveUser } = require("../middleware/requireAuth");
const ids = require("../utils/ids");
const { buyerIntakeSchema } = require("../validation/schemas");

const router = express.Router();

router.post(
  "/buyer/intake",
  asyncHandler(async (req, res) => {
    const payload = buyerIntakeSchema.parse(req.body);
    const user = await tryResolveUser(req);

    const record = {
      intake_id: ids.genIntakeId(),
      user_id: user ? user.user_id : null,
      ...payload,
      status: "new",
      created_at: new Date().toISOString(),
    };
    const created = await repos.buyerIntakes.create(record);
    res.json(created);
  })
);

router.get(
  "/buyer/intakes",
  requireAuth,
  asyncHandler(async (req, res) => {
    const rows =
      req.user.role === "admin"
        ? await repos.buyerIntakes.listAll()
        : await repos.buyerIntakes.listForUser(req.user.user_id);
    res.json(rows);
  })
);

module.exports = router;
