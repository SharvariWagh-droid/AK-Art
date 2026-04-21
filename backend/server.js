require("dotenv").config(); 

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");

const authRoutes        = require("./routes/authRoutes");
const artworkRoutes     = require("./routes/artworkRoutes");
const homepageRoutes    = require("./routes/homepageRoutes");
const orderRoutes       = require("./routes/orderRoutes");
const paymentRoutes     = require("./routes/paymentRoutes");
const testimonialRoutes = require("./routes/testimonialRoutes");
const aboutRoutes       = require("./routes/aboutRoutes");
const agencyRoutes      = require("./routes/agencyRoutes");

const app = express();


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "public"))); 

// Serve frontend
app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.use("/api/auth",         authRoutes);
app.use("/api/artworks",     artworkRoutes);
app.use("/api/homepage",     homepageRoutes);
app.use("/api/orders",       orderRoutes);
app.use("/api/payment",      paymentRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/about",        aboutRoutes);
app.use("/api/agency",       agencyRoutes);


app.get("/health", (req, res) => res.json({ status: "ok", db: mongoose.connection.readyState }));


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
    process.exit(1); 
  }
}

startServer();