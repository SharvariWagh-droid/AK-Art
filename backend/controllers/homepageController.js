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

    // Ensure missing fields are added manually for legacy documents
    if (!data.footerTitle) data.footerTitle = "Abhilasha Khatri";
    if (!data.footerDescription) data.footerDescription = "Creating magical worlds and unforgettable characters for the next generation of dreamers. Let’s work together on your next project.";
    if (!data.footerTextColor) data.footerTextColor = "#333333";
    if (!data.footerFontSize) data.footerFontSize = "16px";
    if (!data.footerFontFamily) data.footerFontFamily = "Poppins";
    if (!data.digitalPrintTitle) data.digitalPrintTitle = "Digital Prints";
    if (!data.digitalPrintDescription) data.digitalPrintDescription = "A curated collection of premium illustrations...";
    if (!data.digitalPrintTitleSize) data.digitalPrintTitleSize = "32px";
    if (!data.digitalPrintDescSize) data.digitalPrintDescSize = "16px";
    if (!data.digitalPrintTextColor) data.digitalPrintTextColor = "#000000";

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
    const { 
      heroTitle, 
      heroSubtitle, 
      heroImages,
      heroColorPalette, 
      heroTitleColor, 
      heroSubtitleColor,
      heroTitleSize,
      heroSubtitleSize,
      heroTitleFont,
      heroSubtitleFont,
      globalFont,
      theme,
      footerTitle,
      footerDescription,
      footerTextColor,
      footerFontSize,
      footerFontFamily,
      digitalPrintTitle,
      digitalPrintDescription,
      digitalPrintTitleSize,
      digitalPrintDescSize,
      digitalPrintTextColor
    } = req.body;

    const update = {};
    if (heroTitle !== undefined) update.heroTitle = heroTitle;
    if (heroSubtitle !== undefined) update.heroSubtitle = heroSubtitle;
    if (heroColorPalette !== undefined) update.heroColorPalette = heroColorPalette;
    if (heroTitleColor !== undefined) update.heroTitleColor = heroTitleColor;
    if (heroSubtitleColor !== undefined) update.heroSubtitleColor = heroSubtitleColor;
    if (heroTitleSize !== undefined) update.heroTitleSize = heroTitleSize;
    if (heroSubtitleSize !== undefined) update.heroSubtitleSize = heroSubtitleSize;
    if (heroTitleFont !== undefined) update.heroTitleFont = heroTitleFont;
    if (heroSubtitleFont !== undefined) update.heroSubtitleFont = heroSubtitleFont;
    if (globalFont !== undefined) update.globalFont = globalFont;
    if (theme !== undefined) update.theme = theme;
    if (footerTitle !== undefined) update.footerTitle = footerTitle;
    if (footerDescription !== undefined) update.footerDescription = footerDescription;
    if (footerTextColor !== undefined) update.footerTextColor = footerTextColor;
    if (footerFontSize !== undefined) update.footerFontSize = footerFontSize;
    if (footerFontFamily !== undefined) update.footerFontFamily = footerFontFamily;
    if (digitalPrintTitle !== undefined) update.digitalPrintTitle = digitalPrintTitle;
    if (digitalPrintDescription !== undefined) update.digitalPrintDescription = digitalPrintDescription;
    if (digitalPrintTitleSize !== undefined) update.digitalPrintTitleSize = digitalPrintTitleSize;
    if (digitalPrintDescSize !== undefined) update.digitalPrintDescSize = digitalPrintDescSize;
    if (digitalPrintTextColor !== undefined) update.digitalPrintTextColor = digitalPrintTextColor;

    if (heroImages !== undefined) {
      const arr = Array.isArray(heroImages) ? heroImages : [heroImages];
      update.heroImages = arr.filter(Boolean);
    }

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