const express = require("express");
const Category = require("../models/Category");
const adminAuth = require("../middleware/adminAuth");
const upload = require("../middleware/upload");
const router = express.Router();

/* CREATE CATEGORY (ADMIN ONLY) */
router.post("/", isAdmin, async (req, res) => {
  const { name } = req.body;
  const category = new Category({ name });
  await category.save();
  res.send("Category created");
});

/* GET ALL CATEGORIES (PUBLIC) */
router.get("/", async (req, res) => {
  const categories = await Category.find();
  res.json(categories);
});

module.exports = router;


router.post("/", adminAuth, upload.single("image"), async (req, res) => {
  // add product
});

router.delete("/:id", adminAuth, async (req, res) => {
  // delete product
});
