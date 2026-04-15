const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: "rzp_test_SWwx1VajdB2nHb",
  key_secret: "yz8quu1EkLjMomFgCjza3MuU"
});

router.post("/create-order", async (req, res) => {
    try {
        const { amount } = req.body;

        const options = {
            amount: amount * 100, // ✅ IMPORTANT (₹ → paise)
            currency: "INR",
            receipt: "receipt_" + Date.now(),
        };

        const order = await razorpay.orders.create(options);
        res.json(order);

    } catch (err) {
        console.log(err);
        res.status(500).send("Error creating order");
    }
});

module.exports = router;