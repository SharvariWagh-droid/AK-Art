const express = require("express");
const router = express.Router();
const Testimonial = require("../models/Testimonial");
const TestimonialStyle = require("../models/TestimonialStyle");

// --- GET STYLE SETTINGS ---
router.get("/style", async (req, res) => {
  try {
    const style = await TestimonialStyle.findOne();
    res.json(style || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SAVE STYLE SETTINGS ---
router.post("/style", async (req, res) => {
  try {
    const data = {
      textSize: req.body.testimonialTextSize,
      nameSize: req.body.testimonialNameSize,
      textColor: req.body.testimonialTextColor,
      palette: req.body.testimonialColorPalette
    };

    const style = await TestimonialStyle.findOneAndUpdate(
      {},
      data,
      { new: true, upsert: true }
    );

    res.json(style);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- EXISTING CRUD ROUTES (DO NOT CHANGE LOGIC) ---

// Fetch all testimonials
router.get("/", async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.json(testimonials);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Add new testimonial
router.post("/", async (req, res) => {
  try {
    const { name, message, image } = req.body;
    if (!name || !message) {
      return res.status(400).json({ error: "Missing required fields: name, message" });
    }
    
    const testimonial = new Testimonial({ name, message, image });
    await testimonial.save();
    res.status(201).json({ message: "Testimonial added successfully", testimonial });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update testimonial
router.put("/:id", async (req, res) => {
  try {
    const { name, message, image } = req.body;
    const updatedTestimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      { name, message, image },
      { new: true, runValidators: true }
    );
    if (!updatedTestimonial) {
      return res.status(404).json({ error: "Testimonial not found" });
    }
    res.json({ message: "Testimonial updated successfully", testimonial: updatedTestimonial });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete testimonial
router.delete("/:id", async (req, res) => {
  try {
    const deletedTestimonial = await Testimonial.findByIdAndDelete(req.params.id);
    if (!deletedTestimonial) {
      return res.status(404).json({ error: "Testimonial not found" });
    }
    res.json({ message: "Testimonial deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
