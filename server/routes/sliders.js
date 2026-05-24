const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs").promises;
const path = require("path");
const Slider = require("../models/Slider");
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


/* ADD SLIDE */
router.post("/", isAdmin, upload.single("image"), async (req, res, next) => {
  console.log('Add slide request received');
  console.log('File info:', req.file);
  console.log('Body fields:', req.body);

  try {
    if (!req.file) {
      return res.status(400).json({ message: "An image file is required for the slider banner." });
    }

    if (mongoose.connection.readyState !== 1) {
      console.log("DB Offline: Adding Slider in Demo Mode");
      const newSlide = {
        _id: "slide_" + Date.now(),
        image: getImageUrl(req.file),
        order: Number(req.body.order) || 0,
        active: true
      };
      demoDb.sliders.push(newSlide);
      return res.status(201).json({ message: "Slide added", slide: newSlide });
    }

    const slide = new Slider({
      image: getImageUrl(req.file),
      order: req.body.order || 0,
      active: true
    });

    await slide.save();
    console.log('Slide saved:', slide);
    res.status(201).json({ message: "Slide added", slide });
  } catch (err) {
    next(err);
  }
});

/* GET SLIDES */
router.get("/", async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const slides = demoDb.sliders.filter(s => s.active).sort((a, b) => a.order - b.order);
      return res.json(slides);
    }

    const slides = await Slider.find({ active: true }).sort({ order: 1 });
    console.log('Slides fetched:', slides);
    if (!Array.isArray(slides)) {
      console.warn('Slides is not an array, returning empty array');
      return res.json([]);
    }
    res.json(slides);
  } catch (err) {
    console.error('Error loading slides:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

/* DELETE SLIDE */
router.delete("/:id", isAdmin, async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log("DB Offline: Deleting Slider in Demo Mode");
      const index = demoDb.sliders.findIndex(s => s._id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ message: "Slide banner not found." });
      }

      const slide = demoDb.sliders[index];
      // Delete image file from disk
      await deleteLocalFile(slide.image);

      demoDb.sliders.splice(index, 1);
      return res.send("Slide deleted");
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid slide ID format." });
    }

    const slide = await Slider.findById(req.params.id);
    if (!slide) {
      return res.status(404).json({ message: "Slide banner not found." });
    }

    // Delete image file from disk
    await deleteLocalFile(slide.image);

    await Slider.findByIdAndDelete(req.params.id);
    res.send("Slide deleted");
  } catch (err) {
    next(err);
  }
});

module.exports = router;