const fs = require("fs");
const path = require("path");

module.exports = async () => {
  await global.__MONGO__.stop();
  const uploadsDir = path.join(__dirname, "../../uploads");
  if (global.__CREATED_UPLOADS__ && fs.existsSync(uploadsDir) && fs.readdirSync(uploadsDir).length === 0) fs.rmdirSync(uploadsDir);
};
