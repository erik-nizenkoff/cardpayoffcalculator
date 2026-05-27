const { defineConfig } = require("@playwright/test");

const port = Number(process.env.PORT || 4173);

module.exports = defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.js",
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:" + port,
    browserName: "chromium",
    channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
    viewport: { width: 390, height: 844 }
  },
  webServer: {
    command: "node tests/static-server.js",
    url: "http://127.0.0.1:" + port,
    reuseExistingServer: !process.env.CI,
    timeout: 10000
  }
});
