// Tauri desktop environment — used when building with `nx build probable-waffle-client --configuration=tauri`.
// Replace `environment.ts` with this file for Tauri desktop builds.

import type { Environment } from "./environment-type";
// eslint-disable-next-line @nx/enforce-module-boundaries
import packageJson from "../../../../package.json";

export const environment: Environment = {
  production: true,
  // The hosted NestJS API — desktop app connects to the same backend as the web app.
  api: "https://fuzzy-waddle-api.onrender.com/",
  supabase: {
    url: "https://bhzetyxjimpabioxoodz.supabase.co",
    key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoemV0eXhqaW1wYWJpb3hvb2R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzM3OTQ4NTcsImV4cCI6MTk4OTM3MDg1N30.qXNM5FGjVb9scqNxBL3EHYl1HL-RI2NZNGXceZGTMLs"
  },
  socketIoConfig: {
    url: "https://fuzzy-waddle-api.onrender.com",
    options: {}
  },
  version: packageJson.version
};
