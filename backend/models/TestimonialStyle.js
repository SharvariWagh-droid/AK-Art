const mongoose = require("mongoose");

const testimonialStyleSchema = new mongoose.Schema({
  textSize: {
    type: String,
    default: "16px"
  },
  nameSize: {
    type: String,
    default: "14px"
  },
  textColor: {
    type: String,
    default: "#333"
  },
  palette: {
    type: String,
    default: "custom"
  }
}, { timestamps: true });

module.exports = mongoose.model("TestimonialStyle", testimonialStyleSchema);
