import type Phaser from "phaser";
import type { AiRuntimeBrowserInitialStateV1 } from "./ai-runtime-browser-initial-state-v1";
import type { AiRuntimeBrowserTestConfigV1 } from "./ai-runtime-browser-test-config-v1";
import type { AiRuntimePresetApplicationV1 } from "./ai-runtime-preset-application-v1";

/** Test-only handle to the real Phaser game created by the ordinary Angular game route. */
export interface AiRuntimeBrowserTestHostV1 {
  readonly schemaVersion: 1;
  readonly config: AiRuntimeBrowserTestConfigV1;
  readonly game: Phaser.Game;
  readonly initialStateByPlayer: Readonly<Record<number, AiRuntimeBrowserInitialStateV1>>;
  readonly presetApplication?: AiRuntimePresetApplicationV1;
}
