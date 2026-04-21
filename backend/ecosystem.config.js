// ecosystem.config.js
// This file is SAFE to push to GitHub — no secrets inside
module.exports = {
  apps: [
    {
      name: "ak-art-backend",
      script: "server.js",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "500M",
      error_file: "./logs/error.log",
      out_file:   "./logs/out.log",
    },
  ],
};