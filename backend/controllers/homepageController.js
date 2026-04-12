const path = require("path");
const Homepage = require("../models/Homepage");

// ==============================
// 📥 GET HOMEPAGE DATA
// ==============================
exports.getHomepage = async (req, res) => {
  try {
    let data = await Homepage.findOne();

    // Create default if not exists
    if (!data) {
      data = new Homepage({
        heroTitle: "",
        heroSubtitle: "",
        heroImages: []
      });
      await data.save();
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Error fetching homepage data" });
  }
};

// ==============================
// ✏️ UPDATE TEXT DATA ONLY
// ==============================
exports.updateHomepage = async (req, res) => {
  try {
    const { heroTitle, heroSubtitle } = req.body;

    const update = {};
    if (heroTitle !== undefined) update.heroTitle = heroTitle;
    if (heroSubtitle !== undefined) update.heroSubtitle = heroSubtitle;

    const data = await Homepage.findOneAndUpdate(
      {},
      { $set: update },
      { new: true, upsert: true }
    );

    res.json({ message: "Homepage updated successfully", data });
  } catch (err) {
    res.status(500).json({ message: "Error updating homepage data" });
  }
};

// ==============================
// 🖼 UPLOAD HERO IMAGES (FIXED)
// ==============================
exports.uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(200).json({
        message: "No images uploaded",
        files: []
      });
    }

    // ✅ ALWAYS USE EXACT FILENAME FROM MULTER
    const files = req.files.map(file => file.filename);

    if (files.length > 5) {
      return res.status(400).json({ error: "Max 5 images allowed" });
    }

    let homepage = await Homepage.findOne();

    if (!homepage) {
      homepage = new Homepage({
        heroTitle: "",
        heroSubtitle: "",
        heroImages: files
      });
    } else {
      homepage.heroImages = files; // overwrite
    }

    await homepage.save();

    res.json({
      message: "Images uploaded successfully",
      files
    });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};