const express = require("express");
const categories = require("../data/categories");
const pricing = require("../data/pricing");

const router = express.Router();

router.get("/categories", (req, res) => {
  res.json(categories);
});

router.get("/pricing", (req, res) => {
  res.json(pricing);
});

module.exports = router;
