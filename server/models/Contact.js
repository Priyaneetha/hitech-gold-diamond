const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    default: "+91 9447384746"
  },
  whatsapp: {
    type: String,
    required: true,
    default: "919447384746"
  },
  address: {
    type: String,
    required: true,
    default: "Kuttiadi, Kerala, India"
  },
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Contact", contactSchema);
