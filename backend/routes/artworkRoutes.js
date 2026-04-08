const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const Artwork = require("../models/artwork");

router.get("/", async (req, res) => {
  try {
    console.log("API HIT");
    
    // Support ?type= filtering to stop mixing issues natively
    const { type } = req.query;
    const filter = type ? { type } : {};

    const artworks = await Artwork.find(filter);

    console.log("DATA:", artworks.length);

    res.json(artworks);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/add", async (req, res) => {
  try {
    const { title, type, image } = req.body;

    if (!type || !image) {
      return res.status(400).json({ error: "Missing required fields: type, image" });
    }

    let finalImageUrl = image;
    let finalTitle = title ? title : `Artwork ${Math.floor(Math.random() * 10000)}`;
    
    // Check if frontend sent a base64 data string
    if (image.startsWith("data:image")) {
      const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        let ext = matches[1].split("/")[1];
        if (ext === "jpeg") ext = "jpg";
        const buffer = Buffer.from(matches[2], "base64");
        const filename = `art_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;
        const filePath = path.join(__dirname, "../uploads", filename);
        
        fs.writeFileSync(filePath, buffer);
        finalImageUrl = `http://localhost:5000/uploads/${filename}`;
      }
    }

    const existingArtwork = await Artwork.findOne({ title: finalTitle, type });
    if (existingArtwork) {
      return res.status(400).json({ error: "Artwork already exists" });
    }

    const art = new Artwork({ ...req.body, title: finalTitle, image: finalImageUrl });
    await art.save();
    res.json({ message: "Added" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updatedUser = await Artwork.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedUser) return res.status(404).json({ error: "Artwork not found" });
    res.json({ message: "Updated successfully", artwork: updatedUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deletedUser = await Artwork.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ error: "Artwork not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;