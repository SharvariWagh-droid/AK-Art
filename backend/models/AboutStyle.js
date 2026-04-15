const mongoose = require("mongoose");

const aboutStyleSchema = new mongoose.Schema({
  nameSize: { type: String, default: "28px" },
  bioSize: { type: String, default: "16px" },
  worksSize: { type: String, default: "14px" },
  textColor: { type: String, default: "#333" },
  palette: { type: String, default: "custom" }
}, { timestamps: true });

module.exports = mongoose.model("AboutStyle", aboutStyleSchema);
