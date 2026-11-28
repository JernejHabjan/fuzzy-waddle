import { environment } from "@fuzzy-waddle/environments/environment";

const storageKey = "fuzzy-waddle:multiplayer-e2e-auth-v1";

/** Restrict the browser's public-key test override to a local development origin and local Supabase. */
export function readMultiplayerE2eAuthConfig(): { readonly url: string; readonly key: string } | null {
  if (environment.production || typeof window === "undefined" ||
      !["localhost", "127.0.0.1"].includes(window.location.hostname)) return null;
  const raw = window.sessionStorage.getItem(storageKey);
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const config = value as Record<string, unknown>;
    if (config.schemaVersion !== 1 || typeof config.url !== "string" ||
        typeof config.publicAnonKey !== "string" || config.publicAnonKey.length < 10) return null;
    const url = new URL(config.url);
    if (url.protocol !== "http:" || !["localhost", "127.0.0.1"].includes(url.hostname) ||
        url.port !== "54321" || url.pathname !== "/" || url.username || url.password || url.search || url.hash)
      return null;
    return { url: url.origin, key: config.publicAnonKey };
  } catch {
    return null;
  }
}
