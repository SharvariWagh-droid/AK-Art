const fs = require("fs");
const path = require("path");
const http = require("http");

const uploadsDir = path.join(__dirname, "../../uploads");

/**
 * server.js connects and starts listening when it is loaded, and exports nothing. This loads it
 * once per test file and waits for it to listen. Files the tests add to backend/uploads are
 * removed again when it stops.
 */
async function startApp() {
  const before = new Set(fs.readdirSync(uploadsDir));

  const listen = jest.spyOn(http.Server.prototype, "listen");
  const log = jest.spyOn(console, "log").mockImplementation(() => {});
  require("../../server.js");
  const mongoose = require("mongoose");
  for (let i = 0; i < 200 && listen.mock.instances.length === 0; i++) await new Promise((r) => setTimeout(r, 25));
  const server = listen.mock.instances[0];
  listen.mockRestore();
  log.mockRestore();

  return {
    server,
    mongoose,
    uploadsDir,
    async stop() {
      await new Promise((resolve) => server.close(resolve));
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
      for (const file of fs.readdirSync(uploadsDir)) if (!before.has(file)) fs.rmSync(path.join(uploadsDir, file));
    },
  };
}

/** A real 40×30 PNG made with the app's own sharp, for upload and resize tests. */
const makePng = () =>
  require("sharp")({ create: { width: 40, height: 30, channels: 3, background: "#cc3333" } }).png().toBuffer();

module.exports = { startApp, makePng };
