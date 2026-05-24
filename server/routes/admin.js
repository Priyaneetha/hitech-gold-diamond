const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Admin = require("../models/Admin");
const demoDb = require("../utils/demoDb");

const router = express.Router();

/* LOGIN */
router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;

    let admin;
    if (mongoose.connection.readyState !== 1) {
      console.log("DB Offline: Processing login via Demo Mode");
      admin = demoDb.admins.find(a => a.username === username);
    } else {
      admin = await Admin.findOne({ username });
    }

    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    req.session.admin = admin._id;
    res.json({ message: "Login successful" });
  } catch (err) {
    next(err);
  }
});

/* AUTH CHECK */
router.get("/check", (req, res) => {
  if (req.session.admin) {
    res.json({ authenticated: true });
  } else {
    res.status(401).json({ authenticated: false });
  }
});

/* LOGOUT */
router.post("/logout", (req, res) => {
  req.session.destroy();
  res.json({ message: "Logged out" });
});

module.exports = router;