const mongoose = require("mongoose");

const aboutSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  bio: {
    type: String,
    required: true
  },
  image: {
    type: String
  },
  publishedWorks: [
    {
      title: { type: String, default: "" },
      details: { type: String, default: "" },
      link: { type: String, default: "" }
    }
  ],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("About", aboutSchema);
