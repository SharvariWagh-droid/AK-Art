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
        if (!amount || isNaN(amount) || amount <= 0) {
            console.log("INVALID AMOUNT RECEIVED:", amount);
            return res.status(400).send("Invalid amount");
        }

        const options = {
            amount: Math.round(amount * 100), // ✅ Ensure integer paise
            currency: "INR",
            receipt: "receipt_" + Date.now(),
        };

        const order = await razorpay.orders.create(options);
        res.json(order);

    } catch (err) {
        console.error("RAZORPAY ORDER ERROR:", err.message);
        res.status(500).send("Error creating order: " + err.message);
    }
});

module.exports = router;