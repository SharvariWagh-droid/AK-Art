const Order = require("../models/order");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

// CREATE ORDER
exports.createOrder = async (req, res) => {
  try {

    const { userId, userName, email, artName, artworkName, price, image, paymentId, status } = req.body;

    // Enhanced validation
    if (!userId || !paymentId || (!artName && !artworkName)) {
      return res.status(400).json({ message: "Invalid order data: Missing required fields" });
    }

    const order = new Order({
      userId: userId, // Link to user
      userName,
      email,
      artName: artworkName || artName, // Support both names
      price,
      image: (image && image.startsWith('http')) ? image.split('/').pop() : image,
      paymentId,
      status: "Paid" // Default to Paid
    });

    await order.save();

    res.json({ message: "Order saved", orderId: order._id });

  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};


// GET ALL ORDERS (ADMIN)
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET ORDERS FOR SINGLE USER (NEW)
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId });
    res.json(orders);
  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};


// GET ORDER BY PAYMENT ID (FOR SUCCESS PAGE)
exports.getOrderByPaymentId = async (req, res) => {
  try {
    const order = await Order.findOne({ paymentId: req.params.paymentId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(order);
  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// DOWNLOAD ARTWORK
exports.downloadArtwork = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, "../uploads", filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    res.download(filePath, (err) => {
      if (err) {
        console.error("Download error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Download failed" });
        }
      }
    });

  } catch (err) {
    console.error("ERROR:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
};

// DOWNLOAD RESIZED ARTWORK
exports.downloadArtworkResized = async (req, res) => {
  try {
    const { filename, size, format } = req.params;

    // Validation
    const validSizes = {
      "6x7": { width: 1800, height: 2100 },
      "8x12": { width: 2400, height: 3600 }
    };

    const validFormats = ["jpg", "png"];

    if (!validSizes[size]) {
      return res.status(400).json({ message: "Invalid size" });
    }

    if (!validFormats.includes(format.toLowerCase())) {
      return res.status(400).json({ message: "Invalid format" });
    }

    const filePath = path.join(__dirname, "../uploads", filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Original file not found" });
    }

    const { width, height } = validSizes[size];
    const targetFormat = format.toLowerCase() === "jpg" ? "jpeg" : "png";

    const buffer = await sharp(filePath)
      .resize(width, height)
      .toFormat(targetFormat)
      .toBuffer();

    const title = req.query.title || "artwork";

    res.set({
      "Content-Type": `image/${targetFormat}`,
      "Content-Disposition": `attachment; filename="${title}.${format}"`
    });

    res.send(buffer);

  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};