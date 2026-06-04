const express = require("express");
const mongoose = require("mongoose");
const Contact = require("../models/Contact");
const demoDb = require("../utils/demoDb");
const isAdmin = require("../middleware/isAdmin");

const router = express.Router();

/* SET CONTACT DETAILS */
router.post("/", isAdmin, async (req, res, next) => {
  try {
    const { 
      phone, phone2, phone3, phone4, 
      whatsapp, whatsapp2, 
      instagram, facebook, email, 
      address 
    } = req.body;

    if (!phone || !whatsapp || !address) {
      return res.status(400).json({ message: "Primary Phone, Primary WhatsApp, and Address are required." });
    }

    if (mongoose.connection.readyState !== 1) {
      console.log("DB Offline: Updating Contact Details in Demo Mode");
      demoDb.contact.phone = phone;
      demoDb.contact.phone2 = phone2 || "";
      demoDb.contact.phone3 = phone3 || "";
      demoDb.contact.phone4 = phone4 || "";
      demoDb.contact.whatsapp = whatsapp;
      demoDb.contact.whatsapp2 = whatsapp2 || "";
      demoDb.contact.instagram = instagram || "";
      demoDb.contact.facebook = facebook || "";
      demoDb.contact.email = email || "";
      demoDb.contact.address = address;
      return res.send("Contact details updated");
    }

    // Update the existing active contact details or insert one if none exists (upsert)
    await Contact.findOneAndUpdate(
      { active: true },
      { 
        phone, phone2: phone2 || "", phone3: phone3 || "", phone4: phone4 || "", 
        whatsapp, whatsapp2: whatsapp2 || "", 
        instagram: instagram || "", facebook: facebook || "", email: email || "",
        address, active: true 
      },
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

    const contact = await Contact.findOne({ active: true });
    
    // Fallback and merge missing fields with defaults from demoDb.contact
    const responseData = {
      phone: (contact && contact.phone) || demoDb.contact.phone,
      phone2: (contact && contact.phone2) || demoDb.contact.phone2,
      phone3: (contact && contact.phone3) || demoDb.contact.phone3,
      phone4: (contact && contact.phone4) || demoDb.contact.phone4,
      whatsapp: (contact && contact.whatsapp) || demoDb.contact.whatsapp,
      whatsapp2: (contact && contact.whatsapp2) || demoDb.contact.whatsapp2,
      instagram: (contact && contact.instagram) || demoDb.contact.instagram,
      facebook: (contact && contact.facebook) || demoDb.contact.facebook,
      email: (contact && contact.email) || demoDb.contact.email,
      address: (contact && contact.address) || demoDb.contact.address
    };
    
    res.json(responseData);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
