const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// ROUTES
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const artworkRoutes = require("./routes/artworkRoutes");
const testimonialRoutes = require("./routes/testimonialRoutes");
const aboutRoutes = require("./routes/aboutRoutes");
const agencyRoutes = require("./routes/agencyRoutes");
const homepageRoutes = require("./routes/homepageRoutes");

// ==============================
// MIDDLEWARE
// ==============================
app.use(cors()); // Prioritize CORS
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const fs = require('fs');
const path = require('path');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use("/uploads", express.static(path.resolve(__dirname, "uploads")));
// Serve frontend static files
app.use(express.static(path.join(__dirname, "../frontend")));

// NEW: Serve admin static files
app.use("/admin", express.static(path.join(__dirname, "../admin")));

// NEW: Explicit /frontend route to support relative paths from admin (../frontend/script.js)
app.use("/frontend", express.static(path.join(__dirname, "../frontend")));


// ROUTE MIDDLEWARE
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/artworks", artworkRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/about", aboutRoutes);
app.use("/api/agencies", agencyRoutes);
app.use("/api/homepage", homepageRoutes);

// ==============================
// MONGODB CONNECTION (FIXED)
// ==============================
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
.then(async () => {
  console.log("MongoDB Connected ✅");

  console.log("DB NAME:", mongoose.connection.name);

  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log("COLLECTIONS:", collections.map(c => c.name));

  const test = await mongoose.connection.db
    .collection("artworks")
    .find()
    .toArray();

  console.log("TEST DATA:", test.length);
})
.catch(err => {
  console.error("MongoDB Connection Error:", err);
});

console.log("SERVER STARTED");
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
