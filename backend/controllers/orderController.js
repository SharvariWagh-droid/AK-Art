const Order = require("../models/order");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

// CREATE ORDER
exports.createOrder = async (req, res) => {
  try {

    const { userId, userName, email, artName, price, image, paymentId, status } = req.body;

    const order = new Order({
      userId,
      userName,
      email,
      artName,
      price,
      image,
      paymentId,
      status: status || "Paid"
    });

    await order.save();

    res.json({ message: "Order saved", orderId: order._id });

  } catch (err) {
    console.error("Save error:", err);
    res.status(500).json({ message: "Error saving order" });
  }
};


// GET ALL ORDERS (ADMIN)
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Error fetching orders" });
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
          res.status(500).json({ message: "Download failed" });
        }
      }
    });

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server error" });
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

    res.set({
      "Content-Type": `image/${targetFormat}`,
      "Content-Disposition": `attachment; filename="${filename.split('.')[0]}_${size}.${format}"`
    });

    res.send(buffer);

  } catch (err) {
    console.error("Processing error:", err);
    res.status(500).json({ message: "Error processing image" });
  }
};