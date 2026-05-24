const express = require("express");
const mongoose = require("mongoose");
const GoldRate = require("../models/GoldRate");
const demoDb = require("../utils/demoDb");
const isAdmin = require("../middleware/isAdmin");

const router = express.Router();

/* UPDATE GOLD RATE */
router.post("/", isAdmin, async (req, res, next) => {
  try {
    const { ratePerGram } = req.body;
    if (!ratePerGram || isNaN(ratePerGram) || ratePerGram <= 0) {
      return res.status(400).json({ message: "Invalid rate per gram." });
    }

    if (mongoose.connection.readyState !== 1) {
      console.log("DB Offline: Updating Gold Rate in Demo Mode");
      demoDb.goldRate.ratePerGram = Number(ratePerGram);
      demoDb.goldRate.rate8g = Number(ratePerGram) * 8;
      return res.send("Gold rate updated");
    }

    let rate = await GoldRate.findOne();
    if (!rate) rate = new GoldRate();

    rate.ratePerGram = Number(ratePerGram);
    await rate.save();

    res.send("Gold rate updated");
  } catch (err) {
    next(err);
  }
});

/* GET GOLD RATE */
router.get("/", async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json(demoDb.goldRate);
    }

    const rate = await GoldRate.findOne();
    if (!rate) return res.json({ ratePerGram: 0, rate8g: 0 });

    res.json({
      ratePerGram: rate.ratePerGram,
      rate8g: rate.ratePerGram * 8
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;