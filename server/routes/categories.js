const express = require("express");
const Category = require("../models/Category");
const isAdmin = require("../middleware/isAdmin");

const router = express.Router();

/* CREATE CATEGORY */
router.post("/", isAdmin, async (req, res) => {
  const { name } = req.body;
  const category = new Category({ name });
  await category.save();
  res.send("Category created");
});

/* GET ALL CATEGORIES */
router.get("/", async (req, res) => {
  const categories = await Category.find();
  res.json(categories);
});

module.exports = router;