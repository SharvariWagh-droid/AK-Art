const mongoose = require("mongoose");

const artworkSchema = new mongoose.Schema({
  title: String,
  description: String,
  image: String,
  type: String,
  price: Number,
  attributes: {
    type: [
      {
        key: String,
        value: String
      }
    ],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Artwork", artworkSchema);