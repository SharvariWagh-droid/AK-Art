const express = require("express");
const router = express.Router();

router.post("/login", (req, res) => {
  res.json({ message: "Login OK" });
});

router.post("/register", (req, res) => {
  res.json({ message: "Register OK" });
});

module.exports = router;