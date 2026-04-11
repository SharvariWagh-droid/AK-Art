const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: String,
  userName: String,
  email: String,
  artName: String,
  price: Number,
  image: String,
  paymentId: String,
  status: {
    type: String,
    default: "Paid"
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Order", orderSchema);