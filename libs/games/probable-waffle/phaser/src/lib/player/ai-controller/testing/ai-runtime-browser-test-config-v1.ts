import type { AiRuntimePresetWorldV1 } from "./ai-runtime-preset-world-v1";

/** Explicit developer-harness input. Ordinary skirmish navigation never creates this value. */
export interface AiRuntimeBrowserTestConfigV1 {
  readonly schemaVersion: 1;
  readonly enabled: true;
  readonly seed: number;
  readonly startPaused: true;
  /** Explicit raw authority diagnostics; this does not enable a production oracle or preset brain state. */
  readonly captureProduction?: true;
  /** Native damage callbacks reuse the authority ledger only for explicitly bound combat recipes. */
  readonly captureCombat?: true;
  readonly presetWorld?: AiRuntimePresetWorldV1;
}
