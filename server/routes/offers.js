const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs").promises;
const path = require("path");
const Offer = require("../models/Offer");
const demoDb = require("../utils/demoDb");
const upload = require("../middleware/upload");
const isAdmin = require("../middleware/isAdmin");

const router = express.Router();

const getImageUrl = (file) => {
  if (!file) return "";
  if (file.path && (file.path.startsWith("http://") || file.path.startsWith("https://"))) {
    return file.path;
  }
  return `/uploads/${file.filename}`;
};

const deleteLocalFile = async (imageUrl) => {
  if (!imageUrl) return;
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://") || imageUrl.startsWith("/logo")) {
    return;
  }
  const fileName = path.basename(imageUrl);
  const filePath = path.join(__dirname, "..", "uploads", fileName);
  try {
    await fs.unlink(filePath);
  } catch (err) {
    console.warn("Failed to delete local file:", err.message);
  }
};

/* GET ACTIVE OFFERS FOR STOREFRONT */
router.get("/", async (req, res, next) => {
  try {
    const now = new Date();
    if (mongoose.connection.readyState !== 1) {
      // Demo Mode Filtering
      const activeOffers = demoDb.offers.filter(offer => {
        if (!offer.active) return false;
        if (offer.endDate && new Date(offer.endDate) < now) return false;
        return true;
      });
      return res.json(activeOffers);
    }

    // MongoDB Filtering - show if active and not expired
    const activeOffers = await Offer.find({
      active: true,
      $or: [
        { endDate: { $exists: false } },
        { endDate: null },
        { endDate: { $gte: now } }
      ]
    }).sort({ createdAt: -1 });

    res.json(activeOffers);
  } catch (err) {
    next(err);
  }
});

/* GET ALL OFFERS FOR ADMIN DASHBOARD */
router.get("/all", isAdmin, async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json(demoDb.offers);
    }

    const offers = await Offer.find().sort({ createdAt: -1 });
    res.json(offers);
  } catch (err) {
    next(err);
  }
});

/* CREATE OFFER */
router.post("/", isAdmin, upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "An image file is required for the offer banner." });
    }
    if (!req.body.title) {
      return res.status(400).json({ message: "Offer title is required." });
    }

    const offerData = {
      title: req.body.title,
      description: req.body.description || "",
      image: getImageUrl(req.file),
      startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      active: true
    };

    if (mongoose.connection.readyState !== 1) {
      console.log("DB Offline: Adding Offer in Demo Mode");
      const newOffer = {
        _id: "offer_" + Date.now(),
        ...offerData
      };
      demoDb.offers.push(newOffer);
      return res.status(201).json({ message: "Offer added in demo mode", offer: newOffer });
    }

    const offer = new Offer(offerData);
    await offer.save();
    res.status(201).json({ message: "Offer added successfully", offer });
  } catch (err) {
    next(err);
  }
});

/* TOGGLE ACTIVE STATUS */
router.patch("/:id/toggle", isAdmin, async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const index = demoDb.offers.findIndex(o => o._id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ message: "Offer not found." });
      }
      demoDb.offers[index].active = !demoDb.offers[index].active;
      return res.json({ message: "Offer active status toggled", offer: demoDb.offers[index] });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid offer ID format." });
    }

    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: "Offer not found." });
    }

    offer.active = !offer.active;
    await offer.save();
    res.json({ message: "Offer active status toggled", offer });
  } catch (err) {
    next(err);
  }
});

/* DELETE OFFER */
router.delete("/:id", isAdmin, async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log("DB Offline: Deleting Offer in Demo Mode");
      const index = demoDb.offers.findIndex(o => o._id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ message: "Offer not found." });
      }

      const offer = demoDb.offers[index];
      await deleteLocalFile(offer.image);

      demoDb.offers.splice(index, 1);
      return res.send("Offer deleted successfully in demo mode");
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid offer ID format." });
    }

    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: "Offer not found." });
    }

    await deleteLocalFile(offer.image);
    await Offer.findByIdAndDelete(req.params.id);
    res.send("Offer deleted successfully");
  } catch (err) {
    next(err);
  }
});

module.exports = router;
