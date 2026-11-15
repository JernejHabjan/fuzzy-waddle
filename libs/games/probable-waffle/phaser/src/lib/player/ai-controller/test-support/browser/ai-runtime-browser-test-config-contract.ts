import type { AiRuntimePresetWorld } from "../presets/setup/ai-runtime-preset-world";

/** Explicit developer-harness input. Ordinary skirmish navigation never creates this value. */
export interface AiRuntimeBrowserTestConfig {
  readonly schemaVersion: 1;
  readonly enabled: true;
  readonly seed: number;
  readonly startPaused: true;
  /** Explicit raw authority diagnostics; this does not enable a production oracle or preset brain state. */
  readonly captureProduction?: true;
  /** Diagnostic trace stores movement completion and admitted route orders without the production ledger. */
  readonly captureMovementOnly?: true;
  /** Native damage callbacks reuse the authority ledger only for explicitly bound combat recipes. */
  readonly captureCombat?: true;
  readonly presetWorld?: AiRuntimePresetWorld;
}
