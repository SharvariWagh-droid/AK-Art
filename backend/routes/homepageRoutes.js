const express = require("express");
const router = express.Router();
const homepageController = require("../controllers/homepageController");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure accurate path regardless of where the server is started
    const uploadPath = path.join(__dirname, "../uploads/");
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = "art_" + Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

router.get("/", homepageController.getHomepage);
router.put("/", homepageController.updateHomepage);
router.post("/upload", upload.array("heroImages", 5), homepageController.uploadImages);

module.exports = router;
