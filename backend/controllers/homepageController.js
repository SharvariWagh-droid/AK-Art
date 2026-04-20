const path = require("path");
const Homepage = require("../models/Homepage");

// ==============================
// 📥 GET HOMEPAGE DATA
// ==============================
exports.getHomepage = async (req, res) => {
  try {
    let data = await Homepage.findOne();

    if (!data) {
      data = new Homepage({
        heroTitle: "Default Title",
        heroSubtitle: "Default Subtitle",
        heroImages: []
      });
      await data.save();
    }

    const finalData = data.toObject ? data.toObject() : data;

    // Ensure missing fields are added manually for legacy documents
    if (!finalData.footerTitle) finalData.footerTitle = "Abhilasha Khatri";
    if (!finalData.footerDescription) finalData.footerDescription = "Creating magical worlds and unforgettable characters for the next generation of dreamers. Let’s work together on your next project.";
    if (!finalData.footerTextColor) finalData.footerTextColor = "#333333";
    if (!finalData.footerFontSize) finalData.footerFontSize = "16px";
    if (!finalData.footerFontFamily) finalData.footerFontFamily = "Poppins";
    if (!finalData.digitalPrintTitle) finalData.digitalPrintTitle = "Digital Prints";
    if (!finalData.digitalPrintDescription) finalData.digitalPrintDescription = "A curated collection of premium illustrations...";
    if (!finalData.digitalPrintTitleSize) finalData.digitalPrintTitleSize = "32px";
    if (!finalData.digitalPrintDescSize) finalData.digitalPrintDescSize = "16px";
    if (!finalData.digitalPrintTextColor) finalData.digitalPrintTextColor = "#000000";
    if (!finalData.portfolioTitle) finalData.portfolioTitle = "Explore Art & Works";
    if (!finalData.portfolioSubtitle) finalData.portfolioSubtitle = "A curated portfolio of my creative journey.";
    if (!finalData.portfolioTitleColor) finalData.portfolioTitleColor = "#1a1a1a";
    if (!finalData.portfolioSubtitleColor) finalData.portfolioSubtitleColor = "#555555";
    if (!finalData.portfolioTitleSize) finalData.portfolioTitleSize = "48px";
    if (!finalData.portfolioSubtitleSize) finalData.portfolioSubtitleSize = "16px";

    res.json(finalData);
  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ error: err.message });
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

      // ✅ FIXED (ADDED MISSING)
      digitalPrintTitle,
      digitalPrintDescription,
      digitalPrintTitleSize,
      digitalPrintDescSize,
      digitalPrintTextColor,

      // Portfolio
      portfolioTitle,
      portfolioSubtitle,
      portfolioTitleColor,
      portfolioSubtitleColor,
      portfolioTitleSize,
      portfolioSubtitleSize,
      portfolioPalette,

      digitalPrintPalette,
      digitalPrintTitleColor,
      digitalPrintDescColor,

      footerPalette,
      footerTitleColor,
      footerDescColor

    } = req.body;

    const update = {};

    // HERO
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

    // FOOTER
    if (footerTitle !== undefined) update.footerTitle = footerTitle;
    if (footerDescription !== undefined) update.footerDescription = footerDescription;
    if (footerTextColor !== undefined) update.footerTextColor = footerTextColor;
    if (footerFontSize !== undefined) update.footerFontSize = footerFontSize;
    if (footerFontFamily !== undefined) update.footerFontFamily = footerFontFamily;

    // DIGITAL PRINT (FIXED)
    if (digitalPrintTitle !== undefined) update.digitalPrintTitle = digitalPrintTitle;
    if (digitalPrintDescription !== undefined) update.digitalPrintDescription = digitalPrintDescription;
    if (digitalPrintTitleSize !== undefined) update.digitalPrintTitleSize = digitalPrintTitleSize;
    if (digitalPrintDescSize !== undefined) update.digitalPrintDescSize = digitalPrintDescSize;
    if (digitalPrintTextColor !== undefined) update.digitalPrintTextColor = digitalPrintTextColor;
    if (digitalPrintPalette !== undefined) update.digitalPrintPalette = digitalPrintPalette;
    if (digitalPrintTitleColor !== undefined) update.digitalPrintTitleColor = digitalPrintTitleColor;
    if (digitalPrintDescColor !== undefined) update.digitalPrintDescColor = digitalPrintDescColor;

    // FOOTER (EXTENDED)
    if (footerPalette !== undefined) update.footerPalette = footerPalette;
    if (footerTitleColor !== undefined) update.footerTitleColor = footerTitleColor;
    if (footerDescColor !== undefined) update.footerDescColor = footerDescColor;

    // PORTFOLIO (EXPLORE PAGE)
    if (portfolioTitle !== undefined) update.portfolioTitle = portfolioTitle;
    if (portfolioSubtitle !== undefined) update.portfolioSubtitle = portfolioSubtitle;
    if (portfolioTitleColor !== undefined) update.portfolioTitleColor = portfolioTitleColor;
    if (portfolioSubtitleColor !== undefined) update.portfolioSubtitleColor = portfolioSubtitleColor;
    if (portfolioTitleSize !== undefined) update.portfolioTitleSize = portfolioTitleSize;
    if (portfolioSubtitleSize !== undefined) update.portfolioSubtitleSize = portfolioSubtitleSize;
    if (portfolioPalette !== undefined) update.portfolioPalette = portfolioPalette;

    // IMAGES
    if (heroImages !== undefined) {
      update.heroImages = heroImages.filter(img => img !== null);
    }

    let existing = await Homepage.findOne();
    if (!existing) {
      existing = new Homepage({});
    }

    Object.assign(existing, update);
    await existing.save();

    res.json({ message: "Homepage updated successfully", data: existing });

  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ==============================
// 🖼️ UPLOAD HERO IMAGES
// ==============================
exports.uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No images uploaded" });
    }

    const filenames = req.files.map(file => file.filename);
    res.json({ success: true, filenames });
  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
