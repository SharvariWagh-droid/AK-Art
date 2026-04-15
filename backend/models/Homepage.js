const mongoose = require("mongoose");

const homepageSchema = new mongoose.Schema({
  heroTitle: {
    type: String,
    default: "Bringing Stories to Life Through Illustration"
  },
  heroSubtitle: {
    type: String,
    default: "Elegant children's book illustrations that spark imagination and wonder, crafted with heart and digital precision."
  },
  heroImages: {
    type: [String],
    default: []
  },
  heroColorPalette: {
    type: String,
    default: "custom"
  },
  heroTitleColor: {
    type: String,
    default: "#1a1a1a"
  },
  heroSubtitleColor: {
    type: String,
    default: "#555555"
  },
  heroTitleSize: {
    type: String,
    default: "48px"
  },
  heroSubtitleSize: {
    type: String,
    default: "16px"
  },
  heroTitleFont: {
    type: String,
    default: "Poppins"
  },
  heroSubtitleFont: {
    type: String,
    default: "Poppins"
  },
  globalFont: {
    type: String,
    default: "Poppins"
  },
  theme: {
    primaryColor: { type: String, default: "#2563eb" },
    secondaryColor: { type: String, default: "#64748b" },
    backgroundColor: { type: String, default: "#ffffff" },
    textColor: { type: String, default: "#111827" },
    headingColor: { type: String, default: "#111827" },
    hoverColor: { type: String, default: "#1d4ed8" }
  },
  footerTitle: { 
    type: String, 
    default: "Abhilasha Khatri" 
  },
  footerDescription: { 
    type: String, 
    default: "Creating magical worlds and unforgettable characters for the next generation of dreamers. Let’s work together on your next project." 
  },
  footerTextColor: { type: String, default: "#333333" },
  footerFontSize: { type: String, default: "16px" },
  footerFontFamily: { type: String, default: "Poppins" },
  digitalPrintTitle: { type: String, default: "Digital Prints" },
  digitalPrintDescription: { type: String, default: "A curated collection of premium illustrations..." },
  digitalPrintTitleSize: { type: String, default: "32px" },
  digitalPrintDescSize: { type: String, default: "16px" },
  digitalPrintTextColor: { type: String, default: "#000000" }
}, { timestamps: true });

module.exports = mongoose.model("Homepage", homepageSchema);
