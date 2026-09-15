import type Phaser from "phaser";

export const AI_RUNTIME_BROWSER_TEST_CONFIG_KEY_V1 = "fuzzy-waddle:ai-runtime-browser-test-v1";
export const AI_RUNTIME_BROWSER_TEST_HOST_KEY_V1 = "__fuzzyWaddleAiRuntimeBrowserTestV1";

/** Explicit developer-harness input. Ordinary skirmish navigation never creates this value. */
export interface AiRuntimeBrowserTestConfigV1 {
  readonly schemaVersion: 1;
  readonly enabled: true;
  readonly seed: number;
  readonly startPaused: true;
}

export interface AiRuntimeBrowserInitialStateV1 {
  readonly ownedActorCount: number;
  readonly workerCount: number;
}

/** Test-only handle to the real Phaser game created by the ordinary Angular game route. */
export interface AiRuntimeBrowserTestHostV1 {
  readonly schemaVersion: 1;
  readonly config: AiRuntimeBrowserTestConfigV1;
  readonly game: Phaser.Game;
  readonly initialStateByPlayer: Readonly<Record<number, AiRuntimeBrowserInitialStateV1>>;
}

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
    if (
      !value ||
      typeof value !== "object" ||
      (value as Partial<AiRuntimeBrowserTestConfigV1>).schemaVersion !== 1 ||
      (value as Partial<AiRuntimeBrowserTestConfigV1>).enabled !== true ||
      (value as Partial<AiRuntimeBrowserTestConfigV1>).startPaused !== true ||
      !Number.isSafeInteger((value as Partial<AiRuntimeBrowserTestConfigV1>).seed) ||
      ((value as Partial<AiRuntimeBrowserTestConfigV1>).seed ?? 0) < 0
    ) {
      return null;
    }
    return value as AiRuntimeBrowserTestConfigV1;
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

/** Clears only the handle owned by this component instance so a replacement game cannot be detached accidentally. */
export function clearAiRuntimeBrowserTestHostV1(game: Phaser.Game | undefined): void {
  if (game && window[AI_RUNTIME_BROWSER_TEST_HOST_KEY_V1]?.game === game) {
    delete window[AI_RUNTIME_BROWSER_TEST_HOST_KEY_V1];
  }
}
