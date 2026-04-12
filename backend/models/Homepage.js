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
    default: [
      "Personal work/hero1.png",
      "Personal work/hero2.png",
      "Personal work/hero3.png"
    ]
  }
}, { timestamps: true });

module.exports = mongoose.model("Homepage", homepageSchema);
