const express = require("express");
const mongoose = require("mongoose");
const Contact = require("../models/Contact");
const demoDb = require("../utils/demoDb");
const isAdmin = require("../middleware/isAdmin");

const router = express.Router();

/* SET CONTACT DETAILS */
router.post("/", isAdmin, async (req, res, next) => {
  try {
    const { phone, whatsapp, address } = req.body;

    if (!phone || !whatsapp || !address) {
      return res.status(400).json({ message: "Phone, WhatsApp, and Address are required." });
    }

    if (mongoose.connection.readyState !== 1) {
      console.log("DB Offline: Updating Contact Details in Demo Mode");
      demoDb.contact.phone = phone;
      demoDb.contact.whatsapp = whatsapp;
      demoDb.contact.address = address;
      return res.send("Contact details updated");
    }

    // Update the existing active contact details or insert one if none exists (upsert)
    await Contact.findOneAndUpdate(
      { active: true },
      { phone, whatsapp, address, active: true },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.send("Contact details updated");
  } catch (err) {
    next(err);
  }
});

/* GET CONTACT DETAILS */
router.get("/", async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json(demoDb.contact);
    }

    let contact = await Contact.findOne({ active: true });
    
    // Fallback if none seeded/saved yet
    if (!contact) {
      contact = {
        phone: "+91 9447384746",
        whatsapp: "919447384746",
        address: "Kuttiadi, Kerala, India"
      };
    }
    
    res.json(contact);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
