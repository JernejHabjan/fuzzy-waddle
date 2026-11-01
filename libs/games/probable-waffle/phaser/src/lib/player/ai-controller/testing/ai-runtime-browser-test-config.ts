import type Phaser from "phaser";
import type { AiRuntimeBrowserInitialState } from "./ai-runtime-browser-initial-state";
import type { AiRuntimeBrowserTestConfig } from "./ai-runtime-browser-test-config-contract";
import type { AiRuntimeBrowserTestHost } from "./ai-runtime-browser-test-host";
import type { AiRuntimePresetApplication } from "./ai-runtime-preset-application";
import { isAiRuntimeBrowserTestConfig } from "./validate-ai-runtime-browser-test-config";
import { armAiRuntimeIncidentCaptureProbe } from "./ai-runtime-incident-capture-probe";
import { captureAiRuntimeArtifact } from "./capture-ai-runtime-artifact";

export const AI_RUNTIME_BROWSER_TEST_CONFIG_KEY = "fuzzy-waddle:ai-runtime-browser-test";
export const AI_RUNTIME_BROWSER_TEST_HOST_KEY = "__fuzzyWaddleAiRuntimeBrowserTest";

export type { AiRuntimeBrowserInitialState } from "./ai-runtime-browser-initial-state";
export type { AiRuntimeBrowserTestConfig } from "./ai-runtime-browser-test-config-contract";
export type { AiRuntimeBrowserTestHost } from "./ai-runtime-browser-test-host";
export type { AiRuntimePresetApplication } from "./ai-runtime-preset-application";
export type { AiRuntimePresetWorld } from "./ai-runtime-preset-world";

declare global {
  interface Window {
    __fuzzyWaddleAiRuntimeBrowserTest?: AiRuntimeBrowserTestHost;
  }
}

/** Strictly parses the opt-in session value; malformed or partial data leaves the harness disabled. */
export function readAiRuntimeBrowserTestConfig(
  storage: Pick<Storage, "getItem"> = window.sessionStorage
): AiRuntimeBrowserTestConfig | null {
  try {
    const encoded = storage.getItem(AI_RUNTIME_BROWSER_TEST_CONFIG_KEY);
    if (!encoded) return null;
    const value: unknown = JSON.parse(encoded);
    return isAiRuntimeBrowserTestConfig(value) ? value : null;
  } catch {
    return null;
  }
}

export function publishAiRuntimeBrowserTestHost(game: Phaser.Game, config: AiRuntimeBrowserTestConfig): void {
  window[AI_RUNTIME_BROWSER_TEST_HOST_KEY] = {
    schemaVersion: 1,
    config,
    game,
    initialStateByPlayer: {},
    captureRuntimeArtifact: (playerNumber, tick, provenance) => captureAiRuntimeArtifact(game, playerNumber, tick, provenance),
    armIncidentCaptureProbe: (sourceRevision, dirtySourceDigest) => {
      const scene = game.scene.getScenes(true).find((entry) => entry.scene.key.startsWith("Map"));
      if (!scene) throw new Error("native_incident_scene_missing");
      return armAiRuntimeIncidentCaptureProbe(scene, sourceRevision, dirtySourceDigest);
    }
  };
}

/** Records the pre-tick actor facts after the ordinary scene bootstrap has indexed initial map actors. */
export function recordAiRuntimeBrowserInitialState(
  playerNumber: number,
  initialState: AiRuntimeBrowserInitialState
): void {
  const host = window[AI_RUNTIME_BROWSER_TEST_HOST_KEY];
  if (!host) return;
  window[AI_RUNTIME_BROWSER_TEST_HOST_KEY] = {
    ...host,
    initialStateByPlayer: { ...host.initialStateByPlayer, [playerNumber]: initialState }
  };
}

export function recordAiRuntimePresetApplication(application: AiRuntimePresetApplication): void {
  const host = window[AI_RUNTIME_BROWSER_TEST_HOST_KEY];
  if (!host) throw new Error("runtime_test_host_unavailable_for_preset");
  window[AI_RUNTIME_BROWSER_TEST_HOST_KEY] = { ...host, presetApplication: application };
}

export function recordAiRuntimePresetEvent(event: AiRuntimePresetApplication["eventResults"][number]): void {
  const host = window[AI_RUNTIME_BROWSER_TEST_HOST_KEY];
  if (!host?.presetApplication) throw new Error("runtime_test_preset_unavailable_for_event");
  window[AI_RUNTIME_BROWSER_TEST_HOST_KEY] = {
    ...host,
    presetApplication: {
      ...host.presetApplication,
      eventResults: [...host.presetApplication.eventResults, event]
    }
  };
}

/** Clears only the handle owned by this component instance so a replacement game cannot be detached accidentally. */
export function clearAiRuntimeBrowserTestHost(game: Phaser.Game | undefined): void {
  if (game && window[AI_RUNTIME_BROWSER_TEST_HOST_KEY]?.game === game) {
    delete window[AI_RUNTIME_BROWSER_TEST_HOST_KEY];
  }
}
