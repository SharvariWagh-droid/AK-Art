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
    if (!data.portfolioTitle) data.portfolioTitle = "Explore Art & Works";
    if (!data.portfolioSubtitle) data.portfolioSubtitle = "A curated portfolio of my creative journey.";
    if (!data.portfolioTitleColor) data.portfolioTitleColor = "#1a1a1a";
    if (!data.portfolioSubtitleColor) data.portfolioSubtitleColor = "#555555";
    if (!data.portfolioTitleSize) data.portfolioTitleSize = "48px";
    if (!data.portfolioSubtitleSize) data.portfolioSubtitleSize = "16px";

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
      const arr = Array.isArray(heroImages) ? heroImages : [heroImages];
      update.heroImages = arr
        .map(img => (img && img.startsWith("http") ? img.split("/").pop() : img))
        .filter(Boolean);
    }

    let existing = await Homepage.findOne();
    if (!existing) {
      existing = new Homepage({});
    }

    Object.assign(existing, update);
    await existing.save();

    res.json({ message: "Homepage updated successfully", data: existing });

  } catch (err) {
    console.error("UPDATE ERROR:", err); // 👈 NOW YOU WILL SEE REAL ERROR
    res.status(500).json({ message: err.message });
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
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ message: "Error uploading images" });
  }
};
