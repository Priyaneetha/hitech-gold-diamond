const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs").promises;
const path = require("path");
const Product = require("../models/Product");
const Category = require("../models/Category");
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

/* CREATE PRODUCT */
router.post("/", isAdmin, upload.single("image"), async (req, res, next) => {
  try {
    const { name, modelNo, category, price, description, inStock } = req.body;

    if (!name || !category || !price) {
      // Clean up uploaded file if validation failed
      await deleteLocalFile(getImageUrl(req.file));
      return res.status(400).json({ message: "Name, category, and price are required." });
    }

    const isAvailable = inStock === undefined || inStock === "true" || inStock === true;

    if (mongoose.connection.readyState !== 1) {
      console.log("DB Offline: Creating Product in Demo Mode");
      const foundCategory = demoDb.categories.find(c => c._id === category);
      if (!foundCategory) {
        await deleteLocalFile(getImageUrl(req.file));
        return res.status(404).json({ message: "Selected category does not exist." });
      }

      const newProduct = {
        _id: "prod_" + Date.now(),
        name,
        modelNo,
        category: foundCategory,
        price: Number(price),
        description: description || "",
        image: getImageUrl(req.file),
        inStock: isAvailable
      };
      
      demoDb.products.push(newProduct);
      return res.status(201).send("Product created");
    }

    // Validate category format
    if (!mongoose.Types.ObjectId.isValid(category)) {
      await deleteLocalFile(getImageUrl(req.file));
      return res.status(400).json({ message: "Invalid category ID format." });
    }

    // Verify category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      await deleteLocalFile(getImageUrl(req.file));
      return res.status(404).json({ message: "Selected category does not exist." });
    }

    const product = new Product({
      name,
      modelNo,
      category,
      price: Number(price),
      description,
      image: getImageUrl(req.file),
      inStock: isAvailable
    });

    await product.save();
    res.status(201).send("Product created");
  } catch (err) {
    next(err);
  }
});


/* GET ALL PRODUCTS */
router.get("/", async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json(demoDb.products);
    }

    const products = await Product.find().populate("category");
    res.json(products);
  } catch (err) {
    next(err);
  }
});

/* GET SINGLE PRODUCT */
router.get("/:id", async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const product = demoDb.products.find(p => p._id === req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found." });
      }
      return res.json(product);
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid product ID format." });
    }
    const product = await Product.findById(req.params.id).populate("category");
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
});

/* UPDATE PRODUCT */
router.put("/:id", isAdmin, upload.single("image"), async (req, res, next) => {
  try {
    const { name, modelNo, category, price, description, inStock } = req.body;

    if (!name || !category || !price) {
      await deleteLocalFile(getImageUrl(req.file));
      return res.status(400).json({ message: "Name, category, and price are required." });
    }

    const isAvailable = inStock === undefined || inStock === "true" || inStock === true;

    if (mongoose.connection.readyState !== 1) {
      console.log("DB Offline: Updating Product in Demo Mode");
      const index = demoDb.products.findIndex(p => p._id === req.params.id);
      if (index === -1) {
        await deleteLocalFile(getImageUrl(req.file));
        return res.status(404).json({ message: "Product not found." });
      }

      const foundCategory = demoDb.categories.find(c => c._id === category);
      if (!foundCategory) {
        await deleteLocalFile(getImageUrl(req.file));
        return res.status(404).json({ message: "Selected category does not exist." });
      }

      const oldProduct = demoDb.products[index];
      let imagePath = oldProduct.image;

      if (req.file) {
        // Delete old image file
        await deleteLocalFile(oldProduct.image);
        imagePath = getImageUrl(req.file);
      }

      demoDb.products[index] = {
        ...oldProduct,
        name,
        modelNo,
        category: foundCategory,
        price: Number(price),
        description: description || "",
        inStock: isAvailable,
        image: imagePath
      };

      return res.json({ message: "Product updated", product: demoDb.products[index] });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      await deleteLocalFile(getImageUrl(req.file));
      return res.status(400).json({ message: "Invalid product ID format." });
    }

    // Validate category
    if (!mongoose.Types.ObjectId.isValid(category)) {
      await deleteLocalFile(getImageUrl(req.file));
      return res.status(400).json({ message: "Invalid category ID format." });
    }

    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      await deleteLocalFile(getImageUrl(req.file));
      return res.status(404).json({ message: "Selected category does not exist." });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      await deleteLocalFile(getImageUrl(req.file));
      return res.status(404).json({ message: "Product not found." });
    }

    let imagePath = product.image;
    if (req.file) {
      // Delete old image
      await deleteLocalFile(product.image);
      imagePath = getImageUrl(req.file);
    }

    product.name = name;
    product.modelNo = modelNo;
    product.category = category;
    product.price = Number(price);
    product.description = description;
    product.inStock = isAvailable;
    product.image = imagePath;

    await product.save();
    res.json({ message: "Product updated successfully", product });
  } catch (err) {
    next(err);
  }
});


/* DELETE PRODUCT */
router.delete("/:id", isAdmin, async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log("DB Offline: Deleting Product in Demo Mode");
      const index = demoDb.products.findIndex(p => p._id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ message: "Product not found." });
      }

      const product = demoDb.products[index];
      // Delete image from disk if it exists
      await deleteLocalFile(product.image);

      demoDb.products.splice(index, 1);
      return res.send("Product deleted");
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid product ID format." });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    // Delete image from disk if it exists
    await deleteLocalFile(product.image);

    await Product.findByIdAndDelete(req.params.id);
    res.send("Product deleted");
  } catch (err) {
    next(err);
  }
});

/* TOGGLE/UPDATE AVAILABILITY */
router.patch("/:id/availability", isAdmin, async (req, res, next) => {
  try {
    const { inStock } = req.body;
    const isAvailable = inStock === true || inStock === "true";

    if (mongoose.connection.readyState !== 1) {
      console.log("DB Offline: Updating stock status in Demo Mode");
      const product = demoDb.products.find(p => p._id === req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found." });
      }
      product.inStock = isAvailable;
      return res.json({ message: "Availability updated successfully", product });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid product ID format." });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { inStock: isAvailable },
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    res.json({ message: "Availability updated successfully", product });
  } catch (err) {
    next(err);
  }
});

module.exports = router;