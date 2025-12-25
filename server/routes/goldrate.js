const express = require("express");
const GoldRate = require("../models/GoldRate");
const isAdmin = require("../middleware/isAdmin");

const router = express.Router();

/* UPDATE GOLD RATE */
router.post("/", isAdmin, async (req, res) => {
  const { ratePerGram } = req.body;

  let rate = await GoldRate.findOne();
  if (!rate) rate = new GoldRate();

  rate.ratePerGram = ratePerGram;
  await rate.save();

  res.send("Gold rate updated");
});

/* GET GOLD RATE */
router.get("/", async (req, res) => {
  const rate = await GoldRate.findOne();
  if (!rate) return res.json({ ratePerGram: 0, rate8g: 0 });

  res.json({
    ratePerGram: rate.ratePerGram,
    rate8g: rate.ratePerGram * 8
  });
});

module.exports = router;