import type { RuntimeFixture } from "../contracts/skirmish-ai-runtime-fixture";

export interface RuntimeRequest {
  readonly schemaVersion: 1;
  readonly sourceRevision: string;
  readonly dirtySourceDigest: string | null;
  readonly fixtureDigest: string;
  readonly seed: number | null;
  readonly scenarioIds: readonly string[];
  readonly fixtures: readonly RuntimeFixture[];
  readonly diagnosticSelection?: {
    readonly scenarioId: string;
    readonly variantId: string;
    readonly repetition: number;
  };
}
