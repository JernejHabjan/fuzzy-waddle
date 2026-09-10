import type Phaser from "phaser";
import {
  AI_RUNTIME_BROWSER_TEST_CONFIG_KEY_V1,
  clearAiRuntimeBrowserTestHostV1,
  publishAiRuntimeBrowserTestHostV1,
  readAiRuntimeBrowserTestConfigV1
} from "./ai-runtime-browser-test-host";

describe("AI runtime browser test host", () => {
  afterEach(() => {
    window.sessionStorage.removeItem(AI_RUNTIME_BROWSER_TEST_CONFIG_KEY_V1);
    delete window.__fuzzyWaddleAiRuntimeBrowserTestV1;
  });

  it("requires a complete explicit deterministic test configuration", () => {
    window.sessionStorage.setItem(
      AI_RUNTIME_BROWSER_TEST_CONFIG_KEY_V1,
      JSON.stringify({ schemaVersion: 1, enabled: true, seed: 759008, startPaused: true })
    );

    expect(readAiRuntimeBrowserTestConfigV1()).toEqual({
      schemaVersion: 1,
      enabled: true,
      seed: 759008,
      startPaused: true
    });

    window.sessionStorage.setItem(
      AI_RUNTIME_BROWSER_TEST_CONFIG_KEY_V1,
      JSON.stringify({ schemaVersion: 1, enabled: true, seed: -1, startPaused: true })
    );
    expect(readAiRuntimeBrowserTestConfigV1()).toBeNull();

    window.sessionStorage.setItem(
      AI_RUNTIME_BROWSER_TEST_CONFIG_KEY_V1,
      JSON.stringify({ schemaVersion: 1, enabled: true, seed: 759008 })
    );
    expect(readAiRuntimeBrowserTestConfigV1()).toBeNull();
  });

  it("clears only the game instance which owns the published handle", () => {
    const first = {} as Phaser.Game;
    const replacement = {} as Phaser.Game;
    const config = { schemaVersion: 1, enabled: true, seed: 759008, startPaused: true } as const;

    publishAiRuntimeBrowserTestHostV1(first, config);
    clearAiRuntimeBrowserTestHostV1(replacement);
    expect(window.__fuzzyWaddleAiRuntimeBrowserTestV1?.game).toBe(first);
    expect(window.__fuzzyWaddleAiRuntimeBrowserTestV1?.initialStateByPlayer).toEqual({});

    clearAiRuntimeBrowserTestHostV1(first);
    expect(window.__fuzzyWaddleAiRuntimeBrowserTestV1).toBeUndefined();
  });
});
