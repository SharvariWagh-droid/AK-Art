require("dotenv").config(); // ← MUST be line 1, before any other require

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");

// ── Route imports ────────────────────────────────────────────
const authRoutes        = require("./routes/auth");
const artworkRoutes     = require("./routes/artwork");
const homepageRoutes    = require("./routes/homepage");
const orderRoutes       = require("./routes/order");
const paymentRoutes     = require("./routes/payment");
const testimonialRoutes = require("./routes/testimonial");
const aboutRoutes       = require("./routes/about");
const agencyRoutes      = require("./routes/agency");

const app = express();

// ── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files — uploads and frontend
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "public"))); // adjust if frontend path differs

// ── API Routes ───────────────────────────────────────────────
app.use("/api/auth",         authRoutes);
app.use("/api/artworks",     artworkRoutes);
app.use("/api/homepage",     homepageRoutes);
app.use("/api/orders",       orderRoutes);
app.use("/api/payment",      paymentRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/about",        aboutRoutes);
app.use("/api/agency",       agencyRoutes);

// ── Health check ─────────────────────────────────────────────
app.get("/health", (req, res) => res.json({ status: "ok", db: mongoose.connection.readyState }));

// ── ONE connection, ONE server start ─────────────────────────
async function startServer() {
  // Fail loudly if MONGO_URI missing — don't let it silently connect to undefined
  if (!process.env.MONGO_URI) {
    console.error("❌ FATAL: MONGO_URI is undefined. Check your .env file or PM2 ecosystem config.");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // fail fast if Atlas unreachable
      socketTimeoutMS: 45000,
    });
    console.log("✅ MongoDB Connected");

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1); // PM2 will auto-restart — don't hang with a broken DB
  }
}

startServer();