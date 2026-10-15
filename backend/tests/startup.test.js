// server.js is loaded fresh for each scenario, without a real database.
beforeEach(() => jest.resetModules());

const loadServer = () => require("../server.js");

test("stops with an error when MONGO_URI is missing", async () => {
  const uri = process.env.MONGO_URI;
  delete process.env.MONGO_URI;
  // process.exit is recorded, not performed; the code then carries on, so give it a database
  // call that fails quickly.
  jest.spyOn(require("mongoose"), "connect").mockRejectedValue(new Error("no uri"));
  const exit = jest.spyOn(process, "exit").mockImplementation(() => {});
  try {
    loadServer();
    await new Promise((r) => setTimeout(r, 20));
    expect(exit).toHaveBeenNthCalledWith(1, 1);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("MONGO_URI is undefined"));
  } finally {
    process.env.MONGO_URI = uri;
  }
});

test("stops when the database cannot be reached", async () => {
  const mongoose = require("mongoose");
  jest.spyOn(mongoose, "connect").mockRejectedValue(new Error("unreachable"));
  const exited = new Promise((resolve) => jest.spyOn(process, "exit").mockImplementation(resolve));
  loadServer();
  expect(await exited).toBe(1);
  expect(console.error).toHaveBeenCalledWith("❌ MongoDB connection failed:", "unreachable");
});

test("listens on port 5000 by default", async () => {
  const mongoose = require("mongoose");
  jest.spyOn(mongoose, "connect").mockResolvedValue();
  const port = process.env.PORT;
  delete process.env.PORT;
  const express = require("express");
  const listening = new Promise((resolve) =>
    jest.spyOn(express.application, "listen").mockImplementation(function (p, host, cb) {
      cb();
      resolve([p, host]);
    })
  );
  try {
    loadServer();
    expect(await listening).toEqual([5000, "0.0.0.0"]);
  } finally {
    process.env.PORT = port;
  }
});
