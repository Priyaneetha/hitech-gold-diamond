const express = require("express");
const bcrypt = require("bcrypt");
const Admin = require("../models/Admin");

const router = express.Router();

/* Create admin ONCE */
router.post("/create", async (req, res) => {
  const { username, password } = req.body;

  const hash = await bcrypt.hash(password, 10);
  const admin = new Admin({ username, password: hash });

  await admin.save();
  res.send("Admin created");
});

/* Login */
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const admin = await Admin.findOne({ username });
  if (!admin) return res.status(401).json({ message: "Invalid credentials" });

  const match = await bcrypt.compare(password, admin.password);
  if (!match) return res.status(401).json({ message: "Invalid credentials" });

  req.session.admin = true;
  res.json({ message: "Login successful" });
});

/* Check auth */
router.get("/check", (req, res) => {
  if (req.session.admin) res.send("Authenticated");
  else res.status(401).send("Not logged in");
});

/* Logout */
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.send("Logged out");
});

module.exports = router;