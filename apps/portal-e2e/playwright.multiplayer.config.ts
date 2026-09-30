import { defineConfig, devices } from "@playwright/test";

const serviceKey = process.env.AI_MULTIPLAYER_SUPABASE_SERVICE_KEY;

/** Supabase itself is provisioned by the caller; this config owns only the local game API and portal. */
export default defineConfig({
  testDir: "./src/e2e",
  testMatch: "skirmish-ai-multiplayer-*.spec.ts",
  fullyParallel: false,
  retries: 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:4200",
    // Browser traces include storage state; ephemeral auth JWTs must not enter retained artifacts.
    trace: "off",
    screenshot: "only-on-failure"
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node ../../node_modules/nx/dist/bin/nx.js serve api --configuration=development",
      url: "http://127.0.0.1:3333/api/health",
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      stdout: "pipe",
      env: {
        SUPABASE_URL: "http://127.0.0.1:54321",
        SUPABASE_SERVICE_KEY: serviceKey ?? "",
        CORS_ORIGIN: "http://127.0.0.1:4200"
      }
    },
    {
      command: "node ../../node_modules/nx/dist/bin/nx.js serve portal --configuration=development --host 127.0.0.1",
      url: "http://127.0.0.1:4200",
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      stdout: "pipe"
    }
  ]
});
