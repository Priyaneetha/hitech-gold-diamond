const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ""
  },
  image: {
    type: String,
    required: true
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Offer", offerSchema);
