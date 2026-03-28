const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userName: String,
  email: String,
  artName: String,
  price: Number,
  image: String,
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Order", orderSchema);