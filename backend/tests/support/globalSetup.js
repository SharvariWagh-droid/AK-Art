const { MongoMemoryServer } = require("mongodb-memory-server");

const fs = require("fs");
const path = require("path");

const uploadsDir = path.join(__dirname, "../../uploads");

module.exports = async () => {
  // backend/uploads is git-ignored and created by the app's users; make it for the run if absent.
  global.__CREATED_UPLOADS__ = !fs.existsSync(uploadsDir);
  if (global.__CREATED_UPLOADS__) fs.mkdirSync(uploadsDir);
  const mongo = await MongoMemoryServer.create();
  global.__MONGO__ = mongo;
  process.env.TEST_MONGO_URI = mongo.getUri();
};
