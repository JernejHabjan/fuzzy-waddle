import type { RuntimeAssertionV1 } from "./skirmish-ai-runtime-assertion";
import type { RuntimeVariantV1 } from "./skirmish-ai-runtime-variant";

export interface RuntimeFixtureV1 {
  readonly schemaVersion: 1;
  readonly evidenceKind: "runtime";
  readonly scenarioIds: readonly string[];
  readonly recipe: {
    readonly mapLabel: string;
    readonly aiPlayerNumber: number;
    readonly simulationTimeScale: number;
    readonly checkpointTicks: readonly number[];
    readonly variants: readonly RuntimeVariantV1[];
  };
  readonly assertions: Readonly<Record<string, RuntimeAssertionV1>>;
}
