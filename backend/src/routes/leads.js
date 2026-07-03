const express = require("express");
const repos = require("../repositories");
const asyncHandler = require("../middleware/asyncHandler");
const ids = require("../utils/ids");
const { contactLeadSchema } = require("../validation/schemas");

const router = express.Router();

router.post(
  "/leads",
  asyncHandler(async (req, res) => {
    const payload = contactLeadSchema.parse(req.body);
    const record = {
      lead_id: ids.genLeadId(),
      ...payload,
      created_at: new Date().toISOString(),
    };
    const created = await repos.leads.create(record);
    res.json(created);
  })
);

module.exports = router;
