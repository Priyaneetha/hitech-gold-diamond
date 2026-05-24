const express = require("express");
const mongoose = require("mongoose");
const Category = require("../models/Category");
const Product = require("../models/Product");
const demoDb = require("../utils/demoDb");
const isAdmin = require("../middleware/isAdmin");

const router = express.Router();

/* CREATE CATEGORY */
router.post("/", isAdmin, async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Category name is required." });
    }

    if (mongoose.connection.readyState !== 1) {
      console.log("DB Offline: Creating Category in Demo Mode");
      const exists = demoDb.categories.find(c => c.name.toLowerCase() === name.toLowerCase());
      if (exists) {
        return res.status(400).json({ message: "Category already exists." });
      }
      const newCat = {
        _id: "cat_" + Date.now(),
        name
      };
      demoDb.categories.push(newCat);
      return res.status(201).send("Category created");
    }

    // Check if category already exists
    const exists = await Category.findOne({ name: new RegExp(`^${name}$`, "i") });
    if (exists) {
      return res.status(400).json({ message: "Category already exists." });
    }

    const category = new Category({ name });
    await category.save();
    res.status(201).send("Category created");
  } catch (err) {
    next(err);
  }
});

/* GET ALL CATEGORIES */
router.get("/", async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json(demoDb.categories.sort((a, b) => a.name.localeCompare(b.name)));
    }

    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

/* UPDATE CATEGORY */
router.put("/:id", isAdmin, async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Category name is required." });
    }

    if (mongoose.connection.readyState !== 1) {
      console.log("DB Offline: Updating Category in Demo Mode");
      const category = demoDb.categories.find(c => c._id === req.params.id);
      if (!category) {
        return res.status(404).json({ message: "Category not found." });
      }
      
      const exists = demoDb.categories.find(c => c.name.toLowerCase() === name.toLowerCase() && c._id !== req.params.id);
      if (exists) {
        return res.status(400).json({ message: "Category name already in use." });
      }
      
      category.name = name;
      return res.json({ message: "Category updated", category });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid category ID format." });
    }

    const exists = await Category.findOne({ name: new RegExp(`^${name}$`, "i"), _id: { $ne: req.params.id } });
    if (exists) {
      return res.status(400).json({ message: "Category name already in use." });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }

    res.json({ message: "Category updated", category });
  } catch (err) {
    next(err);
  }
});

/* DELETE CATEGORY */
router.delete("/:id", isAdmin, async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log("DB Offline: Deleting Category in Demo Mode");
      const index = demoDb.categories.findIndex(c => c._id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ message: "Category not found." });
      }

      // Check linked products in demoDb
      const linkedProductCount = demoDb.products.filter(p => p.category && p.category._id === req.params.id).length;
      if (linkedProductCount > 0) {
        return res.status(400).json({
          message: `Cannot delete category. There are ${linkedProductCount} product(s) linked to it. Please delete or reassign those products first.`
        });
      }

      demoDb.categories.splice(index, 1);
      return res.send("Category deleted");
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid category ID format." });
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }

    // Safety check: Prevent deletion if products are linked to this category
    const linkedProductCount = await Product.countDocuments({ category: req.params.id });
    if (linkedProductCount > 0) {
      return res.status(400).json({
        message: `Cannot delete category. There are ${linkedProductCount} product(s) linked to it. Please delete or reassign those products first.`
      });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.send("Category deleted");
  } catch (err) {
    next(err);
  }
});

module.exports = router;