import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./src/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:4200",
    trace: "on-first-retry",
    screenshot: "only-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: {
    command: "node ../../node_modules/nx/dist/bin/nx.js serve portal --configuration=development --host 127.0.0.1",
    url: "http://127.0.0.1:4200",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "pipe"
  }
});
