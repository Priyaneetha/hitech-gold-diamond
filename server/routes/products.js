const express = require("express");
const Product = require("../models/Product");
const upload = require("../middleware/upload");
const isAdmin = require("../middleware/isAdmin");

const router = express.Router();

/* CREATE PRODUCT */
router.post("/", isAdmin, upload.single("image"), async (req, res) => {
  const { name, category, price, description } = req.body;

  const product = new Product({
    name,
    category,
    price,
    description,
    image: req.file ? `/uploads/${req.file.filename}` : ""
  });

  await product.save();
  res.send("Product created");
});

/* GET PRODUCTS */
router.get("/", async (req, res) => {
  const products = await Product.find().populate("category");
  res.json(products);
});

/* DELETE PRODUCT */
router.delete("/:id", isAdmin, async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.send("Product deleted");
});

module.exports = router;