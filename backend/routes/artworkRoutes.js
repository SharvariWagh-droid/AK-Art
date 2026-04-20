const express = require("express");
const router = express.Router();
const artworkController = require("../controllers/artworkController");

router.get("/", artworkController.getArtworks);
router.post("/add", artworkController.addArtwork);
router.put("/:id", artworkController.updateArtwork);
router.delete("/:id", artworkController.deleteArtwork);

module.exports = router;