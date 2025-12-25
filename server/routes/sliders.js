const express = require("express");
const Slider = require("../models/Slider");
const upload = require("../middleware/upload");
const isAdmin = require("../middleware/isAdmin");

const router = express.Router();

/* ADD SLIDE */
router.post("/", isAdmin, upload.single("image"), async (req, res) => {
  const slide = new Slider({
    image: `/uploads/${req.file.filename}`,
    order: req.body.order || 0,
    active: true
  });

  await slide.save();
  res.send("Slide added");
});

/* GET SLIDES */
router.get("/", async (req, res) => {
  const slides = await Slider.find({ active: true }).sort({ order: 1 });
  res.json(slides);
});

/* DELETE SLIDE */
router.delete("/:id", isAdmin, async (req, res) => {
  await Slider.findByIdAndDelete(req.params.id);
  res.send("Slide deleted");
});

module.exports = router;