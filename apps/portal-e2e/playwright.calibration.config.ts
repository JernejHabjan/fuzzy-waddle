import { defineConfig, devices } from "@playwright/test";

/** The outer frozen-source driver owns both servers. Calibration never reuses an unrelated local dev server. */
export default defineConfig({
  testDir: "./src/e2e", fullyParallel: false, workers: 1, retries: 0,
  reporter: "line", use: { baseURL: process.env.AI_CALIBRATION_BASE_URL, trace: "off", screenshot: "off" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }]
});
