import type { RuntimeProductionCausality } from "./skirmish-ai-runtime-production-causality";
// prettier-ignore
import type { AiRuntimeProductionSnapshot } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-snapshot";
import type { normalizeRuntimeProductionSetup } from "./skirmish-ai-runtime-production-setup";
import type { RuntimeProductionLifecycleV2 } from "./skirmish-ai-runtime-production-lifecycle-v2";
// prettier-ignore
import type { AiRuntimeQueueCatalogEntry } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-queue-catalog-entry";

/** Distinct proof clocks and native authority. Diagnostic omissions remain visible and prevent full acceptance. */
export interface RuntimeProductionEvidenceV2 {
  readonly schemaVersion: 2;
  readonly setup: ReturnType<typeof normalizeRuntimeProductionSetup> | null;
  readonly decisions: readonly {
    readonly inputTick: number;
    readonly inputGeneration: number;
    readonly selectedTick: number;
    readonly selectedSequence: number;
    readonly result: Extract<AiRuntimeProductionSnapshot["facts"][number], { kind: "decision_selected" }>["decision"];
  }[];
  readonly coverage: AiRuntimeProductionSnapshot["frontiers"] | null;
  readonly lifecycle: RuntimeProductionLifecycleV2;
  /** Actual, producer-scoped effective definitions, including changes over time. */
  readonly definitions: readonly {
    readonly sequence: number;
    readonly applicationTick: number;
    readonly catalog: readonly AiRuntimeQueueCatalogEntry[];
  }[];
  readonly spatial: RuntimeProductionCausality["spatialAuthority"];
  readonly routes: RuntimeProductionCausality["producerRoutes"];
  readonly movements: RuntimeProductionCausality["movements"];
  readonly failures: readonly string[];
  readonly gaps: readonly string[];
}
