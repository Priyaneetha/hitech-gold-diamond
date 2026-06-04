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
      address, mapLink
    } = req.body;

    const cleanPhone = (phone || "").trim();
    const cleanPhone2 = (phone2 || "").trim();
    const cleanPhone3 = (phone3 || "").trim();
    const cleanPhone4 = (phone4 || "").trim();
    const cleanWhatsapp = (whatsapp || "").trim();
    const cleanWhatsapp2 = (whatsapp2 || "").trim();
    const cleanInstagram = (instagram || "").trim();
    const cleanFacebook = (facebook || "").trim();
    const cleanEmail = (email || "").trim();
    const cleanAddress = (address || "").trim();
    const cleanMapLink = (mapLink || "").trim();

    if (!cleanPhone || !cleanWhatsapp || !cleanAddress) {
      return res.status(400).json({ message: "Primary Phone, Primary WhatsApp, and Address are required." });
    }

    if (mongoose.connection.readyState !== 1) {
      console.log("DB Offline: Updating Contact Details in Demo Mode");
      demoDb.contact.phone = cleanPhone;
      demoDb.contact.phone2 = cleanPhone2;
      demoDb.contact.phone3 = cleanPhone3;
      demoDb.contact.phone4 = cleanPhone4;
      demoDb.contact.whatsapp = cleanWhatsapp;
      demoDb.contact.whatsapp2 = cleanWhatsapp2;
      demoDb.contact.instagram = cleanInstagram;
      demoDb.contact.facebook = cleanFacebook;
      demoDb.contact.email = cleanEmail;
      demoDb.contact.address = cleanAddress;
      demoDb.contact.mapLink = cleanMapLink;
      return res.send("Contact details updated");
    }

    // Update the existing active contact details or insert one if none exists (upsert)
    await Contact.findOneAndUpdate(
      { active: true },
      { 
        phone: cleanPhone, 
        phone2: cleanPhone2, 
        phone3: cleanPhone3, 
        phone4: cleanPhone4, 
        whatsapp: cleanWhatsapp, 
        whatsapp2: cleanWhatsapp2, 
        instagram: cleanInstagram, 
        facebook: cleanFacebook, 
        email: cleanEmail,
        address: cleanAddress,
        mapLink: cleanMapLink,
        active: true 
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
      phone: (contact && contact.phone && contact.phone.trim()) || demoDb.contact.phone,
      phone2: (contact && contact.phone2 && contact.phone2.trim()) || demoDb.contact.phone2,
      phone3: (contact && contact.phone3 && contact.phone3.trim()) || demoDb.contact.phone3,
      phone4: (contact && contact.phone4 && contact.phone4.trim()) || demoDb.contact.phone4,
      whatsapp: (contact && contact.whatsapp && contact.whatsapp.trim()) || demoDb.contact.whatsapp,
      whatsapp2: (contact && contact.whatsapp2 && contact.whatsapp2.trim()) || demoDb.contact.whatsapp2,
      instagram: (contact && contact.instagram && contact.instagram.trim()) || demoDb.contact.instagram,
      facebook: (contact && contact.facebook && contact.facebook.trim()) || demoDb.contact.facebook,
      email: (contact && contact.email && contact.email.trim()) || demoDb.contact.email,
      address: (contact && contact.address && contact.address.trim()) || demoDb.contact.address,
      mapLink: (contact && contact.mapLink && contact.mapLink.trim()) || demoDb.contact.mapLink
    };
    
    res.json(responseData);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
