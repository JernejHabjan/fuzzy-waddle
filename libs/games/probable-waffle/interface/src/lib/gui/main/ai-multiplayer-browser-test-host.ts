import type Phaser from "phaser";
import { environment } from "@fuzzy-waddle/environments/environment";

const marker = "fuzzy-waddle:ai-multiplayer-browser-test-v1";
const hostKey = "__fuzzyWaddleAiMultiplayerBrowserTestV1";

type BrowserTestWindow = Window & { [hostKey]?: { game: Phaser.Game } };

/** Read-only game handle for local two-browser relay inspection; never changes the seeded world. */
export function multiplayerBrowserTestRequested(): boolean {
  return !environment.production && typeof window !== "undefined" &&
    ["localhost", "127.0.0.1"].includes(window.location.hostname) &&
    window.sessionStorage.getItem(marker) === "1";
}

export function publishMultiplayerBrowserTestHost(game: Phaser.Game): void {
  if (multiplayerBrowserTestRequested()) (window as BrowserTestWindow)[hostKey] = { game };
}

export function clearMultiplayerBrowserTestHost(game: Phaser.Game | undefined): void {
  const target = window as BrowserTestWindow;
  if (game && target[hostKey]?.game === game) delete target[hostKey];
}
