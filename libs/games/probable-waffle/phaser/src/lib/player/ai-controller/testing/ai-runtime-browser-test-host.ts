import type Phaser from "phaser";
import type { AiRuntimeBrowserInitialState } from "./ai-runtime-browser-initial-state";
import type { AiRuntimeBrowserTestConfig } from "./ai-runtime-browser-test-config-contract";
import type { AiRuntimePresetApplication } from "./ai-runtime-preset-application";
import type { AiRuntimeProductionSnapshot } from "./ai-runtime-production-snapshot";
import type { armAiRuntimeIncidentCaptureProbe } from "./ai-runtime-incident-capture-probe";
import type { AiRuntimeReproArtifact, AiRuntimeReproProvenance } from "./ai-runtime-scenario-bridge";

/** Test-only handle to the real Phaser game created by the ordinary Angular game route. */
export interface AiRuntimeBrowserTestHost {
  readonly schemaVersion: 1;
  readonly config: AiRuntimeBrowserTestConfig;
  readonly game: Phaser.Game;
  readonly initialStateByPlayer: Readonly<Record<number, AiRuntimeBrowserInitialState>>;
  readonly presetApplication?: AiRuntimePresetApplication;
  readonly captureRuntimeArtifact?: (playerNumber: number, tick: number, provenance: AiRuntimeReproProvenance) =>
    Promise<AiRuntimeReproArtifact>;
  readonly armIncidentCaptureProbe?: (sourceRevision: string, dirtySourceDigest: string | null) =>
    ReturnType<typeof armAiRuntimeIncidentCaptureProbe>;
  /** Read-only host-local authority capture, available only under the explicit production diagnostic opt-in. */
  readonly productionCapture?: {
    capture(playerNumber: number, latestTick?: number): AiRuntimeProductionSnapshot;
    captureHuman?(playerNumber: number, latestTick?: number): AiRuntimeProductionSnapshot;
  };
}
