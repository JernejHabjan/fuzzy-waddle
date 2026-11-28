import type Phaser from "phaser";
import { readAiRuntimeBrowserTestConfig } from "./ai-runtime-browser-test-config";

/** Interactive previews are scoped to the Phaser game. Automated browser runs retain their session marker. */
export function readAiRuntimeSceneConfig(game: Phaser.Game) {
  const host = window.__fuzzyWaddleAiRuntimeBrowserTest;
  return host?.interactive && host.game === game ? host.config : readAiRuntimeBrowserTestConfig();
}
