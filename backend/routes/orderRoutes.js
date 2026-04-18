const express = require("express");
const router = express.Router();

const { createOrder, getOrders, getUserOrders, getOrderByPaymentId, downloadArtwork, downloadArtworkResized } = require("../controllers/orderController");
router.post("/create", createOrder);
router.get("/payment/:paymentId", getOrderByPaymentId);
router.get("/", getOrders);
router.get("/user/:userId", getUserOrders);
router.get("/download/:filename", downloadArtwork);
router.get("/download/:filename/:size/:format", downloadArtworkResized);
module.exports = router;


