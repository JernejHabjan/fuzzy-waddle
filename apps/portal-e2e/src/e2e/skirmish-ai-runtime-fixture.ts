import type { RuntimeAssertion } from "./skirmish-ai-runtime-assertion";
import type { RuntimeVariant } from "./skirmish-ai-runtime-variant";

export interface RuntimeFixture {
  readonly schemaVersion: 1;
  readonly evidenceKind: "runtime";
  readonly scenarioIds: readonly string[];
  /** Explicit unsupported content subcases; these limits never become passing native outcomes. */
  readonly capabilityLimits?: readonly string[];
  readonly recipe: {
    readonly mapLabel: string;
    readonly aiPlayerNumber: number;
    readonly simulationTimeScale: number;
    readonly fixedStepFrames?: boolean;
    readonly requiresMultiplayer?: true;
    readonly checkpointTicks: readonly number[];
    readonly variants: readonly RuntimeVariant[];
  };
  readonly assertions: Readonly<Record<string, RuntimeAssertion>>;
}
