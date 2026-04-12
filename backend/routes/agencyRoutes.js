const express = require("express");
const router = express.Router();
const Agency = require("../models/Agency");

// Get all agencies
router.get("/", async (req, res) => {
  try {
    const agencies = await Agency.find().sort({ createdAt: 1 });
    res.json(agencies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new agency
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });
    
    const agency = new Agency({ name });
    await agency.save();
    res.status(201).json({ message: "Agency added successfully", agency });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update agency
router.put("/:id", async (req, res) => {
  try {
    const { name } = req.body;
    const updatedAgency = await Agency.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true }
    );
    if (!updatedAgency) return res.status(404).json({ error: "Agency not found" });
    res.json({ message: "Agency updated successfully", agency: updatedAgency });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete agency
router.delete("/:id", async (req, res) => {
  try {
    const deletedAgency = await Agency.findByIdAndDelete(req.params.id);
    if (!deletedAgency) return res.status(404).json({ error: "Agency not found" });
    res.json({ message: "Agency deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
