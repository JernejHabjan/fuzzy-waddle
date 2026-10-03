import type Phaser from "phaser";
import type { AiRuntimeBrowserInitialStateV1 } from "./ai-runtime-browser-initial-state-v1";
import type { AiRuntimeBrowserTestConfigV1 } from "./ai-runtime-browser-test-config-v1";
import type { AiRuntimeBrowserTestHostV1 } from "./ai-runtime-browser-test-host-v1";
import type { AiRuntimePresetApplicationV1 } from "./ai-runtime-preset-application-v1";
import { isAiRuntimeBrowserTestConfigV1 } from "./validate-ai-runtime-browser-test-config-v1";

export const AI_RUNTIME_BROWSER_TEST_CONFIG_KEY_V1 = "fuzzy-waddle:ai-runtime-browser-test-v1";
export const AI_RUNTIME_BROWSER_TEST_HOST_KEY_V1 = "__fuzzyWaddleAiRuntimeBrowserTestV1";

export type { AiRuntimeBrowserInitialStateV1 } from "./ai-runtime-browser-initial-state-v1";
export type { AiRuntimeBrowserTestConfigV1 } from "./ai-runtime-browser-test-config-v1";
export type { AiRuntimeBrowserTestHostV1 } from "./ai-runtime-browser-test-host-v1";
export type { AiRuntimePresetApplicationV1 } from "./ai-runtime-preset-application-v1";
export type { AiRuntimePresetWorldV1 } from "./ai-runtime-preset-world-v1";

declare global {
  interface Window {
    __fuzzyWaddleAiRuntimeBrowserTestV1?: AiRuntimeBrowserTestHostV1;
  }
}

/** Strictly parses the opt-in session value; malformed or partial data leaves the harness disabled. */
export function readAiRuntimeBrowserTestConfigV1(
  storage: Pick<Storage, "getItem"> = window.sessionStorage
): AiRuntimeBrowserTestConfigV1 | null {
  try {
    const encoded = storage.getItem(AI_RUNTIME_BROWSER_TEST_CONFIG_KEY_V1);
    if (!encoded) return null;
    const value: unknown = JSON.parse(encoded);
    return isAiRuntimeBrowserTestConfigV1(value) ? value : null;
  } catch {
    return null;
  }
}

export function publishAiRuntimeBrowserTestHostV1(game: Phaser.Game, config: AiRuntimeBrowserTestConfigV1): void {
  window[AI_RUNTIME_BROWSER_TEST_HOST_KEY_V1] = {
    schemaVersion: 1,
    config,
    game,
    initialStateByPlayer: {}
  };
}

/** Records the pre-tick actor facts after the ordinary scene bootstrap has indexed initial map actors. */
export function recordAiRuntimeBrowserInitialStateV1(
  playerNumber: number,
  initialState: AiRuntimeBrowserInitialStateV1
): void {
  const host = window[AI_RUNTIME_BROWSER_TEST_HOST_KEY_V1];
  if (!host) return;
  window[AI_RUNTIME_BROWSER_TEST_HOST_KEY_V1] = {
    ...host,
    initialStateByPlayer: { ...host.initialStateByPlayer, [playerNumber]: initialState }
  };
}

export function recordAiRuntimePresetApplicationV1(application: AiRuntimePresetApplicationV1): void {
  const host = window[AI_RUNTIME_BROWSER_TEST_HOST_KEY_V1];
  if (!host) throw new Error("runtime_test_host_unavailable_for_preset");
  window[AI_RUNTIME_BROWSER_TEST_HOST_KEY_V1] = { ...host, presetApplication: application };
}

export function recordAiRuntimePresetEventV1(event: AiRuntimePresetApplicationV1["eventResults"][number]): void {
  const host = window[AI_RUNTIME_BROWSER_TEST_HOST_KEY_V1];
  if (!host?.presetApplication) throw new Error("runtime_test_preset_unavailable_for_event");
  window[AI_RUNTIME_BROWSER_TEST_HOST_KEY_V1] = {
    ...host,
    presetApplication: {
      ...host.presetApplication,
      eventResults: [...host.presetApplication.eventResults, event]
    }
  };
}

/** Clears only the handle owned by this component instance so a replacement game cannot be detached accidentally. */
export function clearAiRuntimeBrowserTestHostV1(game: Phaser.Game | undefined): void {
  if (game && window[AI_RUNTIME_BROWSER_TEST_HOST_KEY_V1]?.game === game) {
    delete window[AI_RUNTIME_BROWSER_TEST_HOST_KEY_V1];
  }
}
