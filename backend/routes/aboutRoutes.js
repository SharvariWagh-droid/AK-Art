const express = require("express");
const router = express.Router();
const About = require("../models/About");
const AboutStyle = require("../models/AboutStyle");

// --- STYLE SETTINGS (Static routes first!) ---

// Get style settings
router.get("/style", async (req, res) => {
  try {
    const style = await AboutStyle.findOne();
    res.json(style || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save style settings
router.post("/style", async (req, res) => {
  try {
    const data = {
      nameSize: req.body.aboutNameSize || req.body.nameSize,
      bioSize: req.body.aboutBioSize || req.body.bioSize,
      worksSize: req.body.aboutWorksSize || req.body.worksSize,
      textColor: req.body.aboutTextColor || req.body.textColor,
      palette: req.body.aboutPalette || req.body.palette
    };

    const style = await AboutStyle.findOneAndUpdate(
      {},
      data,
      { new: true, upsert: true }
    );
    res.json(style);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get about info
router.get("/", async (req, res) => {
  try {
    const about = await About.findOne();
    res.json(about || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create or overwrite about info
router.post("/", async (req, res) => {
  try {
    const { name, bio, image, publishedWorks } = req.body;
    
    let about = await About.findOne();
    if (about) {
      about.name = name;
      about.bio = bio;
      about.image = image;
      about.publishedWorks = publishedWorks;
      about.updatedAt = Date.now();
      await about.save();
    } else {
      about = new About({ name, bio, image, publishedWorks });
      await about.save();
    }
    
    res.status(201).json({ message: "About info saved successfully", about });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update about info
router.put("/", async (req, res) => {
  try {
    const updates = req.body;
    updates.updatedAt = Date.now();
    
    const about = await About.findOneAndUpdate({}, updates, { new: true, upsert: true });
    res.json({ message: "About info updated successfully", about });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
