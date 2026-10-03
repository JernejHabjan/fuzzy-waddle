import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";

export interface RuntimeRequestV1 {
  readonly schemaVersion: 1;
  readonly sourceRevision: string;
  readonly dirtySourceDigest: string | null;
  readonly fixtureDigest: string;
  readonly seed: number | null;
  readonly scenarioIds: readonly string[];
  readonly fixtures: readonly RuntimeFixtureV1[];
  readonly diagnosticSelection?: {
    readonly scenarioId: string;
    readonly variantId: string;
    readonly repetition: number;
  };
}
