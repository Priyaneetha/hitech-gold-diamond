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

    let contact = await Contact.findOne({ active: true });
    
    // Fallback if none seeded/saved yet
    if (!contact) {
      contact = {
        phone: "+91 9447384746",
        phone2: "",
        phone3: "",
        phone4: "",
        whatsapp: "919447384746",
        whatsapp2: "",
        instagram: "",
        facebook: "",
        email: "",
        address: "Kuttiadi, Kerala, India"
      };
    }
    
    res.json(contact);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
