import { defineConfig, devices } from "@playwright/test";

const skirmishRuntime = Boolean(process.env.AI_SKIRMISH_RUNTIME_REQUEST_PATH);
// Runtime evidence must come from the checked-out source, not a developer's older server on 4200.
const portalPort = skirmishRuntime ? 4201 : 4200;

export default defineConfig({
  testDir: "./src/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://127.0.0.1:${portalPort}`,
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
    command: `node ../../node_modules/nx/dist/bin/nx.js serve portal --configuration=development --host 127.0.0.1 --port=${portalPort}`,
    url: `http://127.0.0.1:${portalPort}`,
    reuseExistingServer: skirmishRuntime ? false : !process.env.CI,
    timeout: 180_000,
    stdout: "pipe"
  }
});
