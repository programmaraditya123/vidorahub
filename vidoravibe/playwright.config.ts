import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests", fullyParallel: false, workers: 1, timeout: 45000,
  use: { baseURL: "http://localhost:3100", channel: "chrome", headless: true, viewport: { width: 1440, height: 1000 } },
  webServer: { command: "node node_modules/next/dist/bin/next start --port 3100", url: "http://localhost:3100", timeout: 120000, reuseExistingServer: false },
});
