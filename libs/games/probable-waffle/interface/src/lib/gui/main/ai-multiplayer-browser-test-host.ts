import type Phaser from "phaser";
import { environment } from "@fuzzy-waddle/environments/environment";
import { captureAiRuntimeArtifact } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/capture-ai-runtime-artifact";

const marker = "fuzzy-waddle:ai-multiplayer-browser-test-v1";
const hostKey = "__fuzzyWaddleAiMultiplayerBrowserTestV1";

type BrowserTestWindow = Window & { [hostKey]?: { game: Phaser.Game;
  captureRuntimeArtifact: (playerNumber: number, tick: number,
    provenance: Parameters<typeof captureAiRuntimeArtifact>[3]) => ReturnType<typeof captureAiRuntimeArtifact> } };

/** Local developer handle for relay inspection and host-gated capture; never changes the seeded world. */
export function multiplayerBrowserTestRequested(): boolean {
  return !environment.production && typeof window !== "undefined" &&
    ["localhost", "127.0.0.1"].includes(window.location.hostname) &&
    window.sessionStorage.getItem(marker) === "1";
}

export function publishMultiplayerBrowserTestHost(game: Phaser.Game): void {
  if (multiplayerBrowserTestRequested()) (window as BrowserTestWindow)[hostKey] = { game,
    captureRuntimeArtifact: (playerNumber, tick, provenance) => captureAiRuntimeArtifact(game, playerNumber, tick, provenance) };
}

export function clearMultiplayerBrowserTestHost(game: Phaser.Game | undefined): void {
  const target = window as BrowserTestWindow;
  if (game && target[hostKey]?.game === game) delete target[hostKey];
}
