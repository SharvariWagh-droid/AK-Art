const path = require("path");

// The shop and admin browser scripts, run against the real HTML pages in jsdom.
module.exports = {
  rootDir: path.resolve(__dirname, ".."),
  testMatch: ["<rootDir>/tests/browser/**/*.test.js"],
  modulePathIgnorePatterns: ["<rootDir>/tests/node_modules"],
  testEnvironment: "jsdom",
  testEnvironmentOptions: { url: "http://localhost/" },
  transform: { "/public/.+\\.js$": "<rootDir>/tests/support/classic-script-transform.js" },
  setupFilesAfterEnv: ["<rootDir>/tests/support/browser-setup.js"],
  collectCoverageFrom: ["public/frontend/script.js", "public/admin/admin.js"],
  coverageDirectory: "<rootDir>/tests/coverage-browser",
};
