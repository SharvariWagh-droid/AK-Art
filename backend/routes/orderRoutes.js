const express = require("express");
const router = express.Router();

const { createOrder, getOrders, downloadArtwork, downloadArtworkResized } = require("../controllers/orderController");
router.post("/create", createOrder);
router.get("/", getOrders);
router.get("/download/:filename", downloadArtwork);
router.get("/download/:filename/:size/:format", downloadArtworkResized);
module.exports = router;


