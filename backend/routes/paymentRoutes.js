const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");



router.post("/create-order", async (req, res) => {
    try {
        const Razorpay = require("razorpay");

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        console.log("RAZORPAY KEY:", process.env.RAZORPAY_KEY_ID);

        const { amount } = req.body;

        if (!amount || isNaN(amount) || amount <= 0) {
            console.log("INVALID AMOUNT RECEIVED:", amount);
            return res.status(400).send("Invalid amount");
        }

        const options = {
            amount: Math.round(amount * 100),
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


router.post("/verify", async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            return res.status(200).json({ success: true, message: "Payment verified successfully" });
        } else {
            return res.status(400).json({ success: false, message: "Invalid signature sent!" });
        }
    } catch (error) {
        console.error("VERIFY ERROR:", error);
        res.status(500).json({ success: false, message: "Internal Server Error!" });
    }
});

module.exports = router;