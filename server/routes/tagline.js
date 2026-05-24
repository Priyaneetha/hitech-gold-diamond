const express = require("express");
const mongoose = require("mongoose");
const BrandTagline = require("../models/BrandTagline");
const demoDb = require("../utils/demoDb");
const isAdmin = require("../middleware/isAdmin");

const router = express.Router();

/* SET TAGLINE */
router.post("/", isAdmin, async (req, res, next) => {
  try {
    const { taglineEnglish, taglineMalayalam } = req.body;

    if (!taglineEnglish || !taglineMalayalam) {
      return res.status(400).json({ message: "Both English and Malayalam slogans are required." });
    }

    if (mongoose.connection.readyState !== 1) {
      console.log("DB Offline: Updating Tagline in Demo Mode");
      demoDb.tagline.taglineEnglish = taglineEnglish;
      demoDb.tagline.taglineMalayalam = taglineMalayalam;
      return res.send("Tagline updated");
    }

    // Update the existing active tagline or insert one if none exists (upsert)
    await BrandTagline.findOneAndUpdate(
      { active: true },
      { taglineEnglish, taglineMalayalam, active: true },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.send("Tagline updated");
  } catch (err) {
    next(err);
  }
});

/* GET TAGLINE */
router.get("/", async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json(demoDb.tagline);
    }

    let tagline = await BrandTagline.findOne({ active: true });
    
    // Fallback if none seeded yet
    if (!tagline) {
      tagline = {
        taglineEnglish: "Crafted in Gold. Defined by Elegance.",
        taglineMalayalam: "വിശ്വാസത്തിന്റെ സ്വർണ്ണം"
      };
    }
    
    res.json(tagline);
  } catch (err) {
    next(err);
  }
});

module.exports = router;