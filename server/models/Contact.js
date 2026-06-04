const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    default: "+91 9447384746"
  },
  phone2: {
    type: String,
    default: ""
  },
  phone3: {
    type: String,
    default: ""
  },
  phone4: {
    type: String,
    default: ""
  },
  whatsapp: {
    type: String,
    required: true,
    default: "919447384746"
  },
  whatsapp2: {
    type: String,
    default: ""
  },
  instagram: {
    type: String,
    default: ""
  },
  facebook: {
    type: String,
    default: ""
  },
  email: {
    type: String,
    default: ""
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
