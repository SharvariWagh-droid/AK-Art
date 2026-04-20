const Artwork = require("../models/artwork");
const fs = require("fs");
const path = require("path");

// GET ALL ARTWORKS
exports.getArtworks = async (req, res) => {
  try {
    const filter = req.query.type ? { type: req.query.type } : {};
    const artworks = await Artwork.find(filter) || [];
    res.json(artworks);
  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ADD ARTWORK
exports.addArtwork = async (req, res) => {
  try {
    const { title, type, image } = req.body;

    if (!type || !image) {
      return res.status(400).json({ error: "Missing required fields: type, image" });
    }

    let finalImageUrl = image.startsWith('http') ? image.split('/').pop() : image;
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
        finalImageUrl = filename;
      }
    }

    const existingArtwork = await Artwork.findOne({ title: finalTitle, type });
    if (existingArtwork) {
      return res.status(400).json({ error: "Artwork already exists" });
    }

    let attributes = req.body.attributes;
    if (typeof attributes === "string") {
      try {
        attributes = JSON.parse(attributes);
      } catch {
        attributes = [];
      }
    }
    if (!Array.isArray(attributes)) {
      attributes = [];
    }

    const art = new Artwork({
      title: finalTitle,
      description: req.body.description,
      image: finalImageUrl,
      type: req.body.type,
      price: req.body.price || 0,
      attributes: attributes
    });
    
    await art.save();
    res.json({ message: "Added" });
  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE ARTWORK
exports.updateArtwork = async (req, res) => {
  try {
    const updated = await Artwork.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: "Artwork not found" });
    res.json({ message: "Updated successfully", artwork: updated });
  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE ARTWORK
exports.deleteArtwork = async (req, res) => {
  try {
    const deleted = await Artwork.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Artwork not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
