const mongoose = require("mongoose");
const Artwork = require("./models/artwork");

const MONGO_URI = "mongodb+srv://sharvariwagh26_db_user:sharvari1207@cluster0.bnzftb5.mongodb.net/akart";

async function cleanupDuplicates() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB for cleanup...");

    const artworks = await Artwork.find();
    console.log(`Found ${artworks.length} total artworks.`);

    const keepIds = new Set();
    const deleteIds = [];
    
    // Using title + type as unique key to identify duplicates
    const uniqueMap = {};

    for (const art of artworks) {
      const key = `${art.title}_${art.type}`;
      
      if (!uniqueMap[key]) {
        uniqueMap[key] = art._id;
        keepIds.add(art._id.toString());
      } else {
        deleteIds.push(art._id);
        console.log(`Duplicate found: ${art.title} (${art.type})`);
      }
    }

    if (deleteIds.length > 0) {
      console.log(`Deleting ${deleteIds.length} duplicate(s)...`);
      await Artwork.deleteMany({ _id: { $in: deleteIds } });
      console.log("Duplicates removed successfully!");
    } else {
      console.log("No duplicates found. The database is clean!");
    }

    process.exit(0);
  } catch (err) {
    console.error("Cleanup Error:", err);
    process.exit(1);
  }
}

cleanupDuplicates();
