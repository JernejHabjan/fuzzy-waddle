import { spawn, spawnSync } from "node:child_process";

const localSupabaseUrl = "http://127.0.0.1:54321";

function credentialsFromLocalStatus() {
  const status = spawnSync("pnpm", ["exec", "supabase", "status", "-o", "json"], {
    encoding: "utf8", stdio: ["ignore", "pipe", "pipe"]
  });
  if (status.status !== 0) throw new Error("local_supabase_status_unavailable");
  const parsed = JSON.parse(status.stdout);
  const url = new URL(parsed.API_URL);
  if (!["localhost", "127.0.0.1"].includes(url.hostname) || url.port !== "54321" || url.protocol !== "http:") {
    throw new Error("local_supabase_api_must_use_port_54321");
  }
  return {
    publicKey: parsed.PUBLISHABLE_KEY ?? parsed.ANON_KEY,
    serviceKey: parsed.SECRET_KEY ?? parsed.SERVICE_ROLE_KEY
  };
}

const suppliedPublic = process.env.AI_MULTIPLAYER_SUPABASE_PUBLIC_KEY;
const suppliedService = process.env.AI_MULTIPLAYER_SUPABASE_SERVICE_KEY;
const keys = suppliedPublic && suppliedService
  ? { publicKey: suppliedPublic, serviceKey: suppliedService }
  : credentialsFromLocalStatus();
if (typeof keys.publicKey !== "string" || !keys.publicKey ||
    typeof keys.serviceKey !== "string" || !keys.serviceKey) {
  throw new Error("local_supabase_public_and_service_keys_required");
}

const runner = spawn("pnpm", ["exec", "playwright", "test", "--config", "apps/portal-e2e/playwright.multiplayer.config.ts"], {
  stdio: "inherit",
  env: {
    ...process.env,
    AI_MULTIPLAYER_E2E: "1",
    AI_MULTIPLAYER_SUPABASE_PUBLIC_KEY: keys.publicKey,
    AI_MULTIPLAYER_SUPABASE_SERVICE_KEY: keys.serviceKey,
    SUPABASE_URL: localSupabaseUrl
  }
});
runner.on("error", () => {
  process.exitCode = 1;
});
runner.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
