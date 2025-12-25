const express = require("express");
const BrandTagline = require("../models/BrandTagline");
const isAdmin = require("../middleware/isAdmin");

const router = express.Router();

/* SET TAGLINE */
router.post("/", isAdmin, async (req, res) => {
  const { taglineEnglish, taglineMalayalam } = req.body;

  await BrandTagline.updateMany({}, { active: false });

  const tagline = new BrandTagline({
    taglineEnglish,
    taglineMalayalam,
    active: true
  });

  await tagline.save();

  res.send("Tagline updated");
});

/* GET TAGLINE */
router.get("/", async (req, res) => {
  const tagline = await BrandTagline.findOne({ active: true });
  res.json(tagline);
});

module.exports = router;