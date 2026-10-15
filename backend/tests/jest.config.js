const path = require("path");

// Launched from backend/ (see package.json) so coverage maps onto the app's files.
module.exports = {
  rootDir: path.resolve(__dirname, ".."),
  testMatch: ["<rootDir>/tests/*.test.js"],
  modulePathIgnorePatterns: ["<rootDir>/tests/node_modules"],
  // The committed backend/node_modules has no jsonwebtoken (package.json and the lockfile do);
  // the test package installs the locked version and Jest falls back to it.
  modulePaths: ["<rootDir>/tests/node_modules"],
  testEnvironment: "node",
  globalSetup: "<rootDir>/tests/support/globalSetup.js",
  globalTeardown: "<rootDir>/tests/support/globalTeardown.js",
  setupFiles: ["<rootDir>/tests/support/env.js"],
  setupFilesAfterEnv: ["<rootDir>/tests/support/setup.js"],
  testTimeout: 30000,
  // The test files share backend/uploads (created for the run if missing), so they run one at a time.
  maxWorkers: 1,
  collectCoverageFrom: ["server.js", "controllers/**/*.js", "routes/**/*.js", "models/**/*.js"],
  coverageDirectory: "<rootDir>/tests/coverage",
};
