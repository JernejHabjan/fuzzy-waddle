import type { RuntimeProductionCausalityV1 } from "./skirmish-ai-runtime-production-causality";
// prettier-ignore
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { normalizeRuntimeProductionSetup } from "./skirmish-ai-runtime-production-setup";
import type { RuntimeProductionLifecycleV2 } from "./skirmish-ai-runtime-production-lifecycle-v2";
// prettier-ignore
import type { AiRuntimeQueueCatalogEntryV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-queue-catalog-entry-v1";

/** Distinct proof clocks and native authority. Diagnostic omissions remain visible and prevent full acceptance. */
export interface RuntimeProductionEvidenceV2 {
  readonly schemaVersion: 2;
  readonly setup: ReturnType<typeof normalizeRuntimeProductionSetup> | null;
  readonly decisions: readonly {
    readonly inputTick: number;
    readonly inputGeneration: number;
    readonly selectedTick: number;
    readonly selectedSequence: number;
    readonly result: Extract<AiRuntimeProductionCaptureV1["facts"][number], { kind: "decision_selected" }>["decision"];
  }[];
  readonly coverage: AiRuntimeProductionCaptureV1["frontiers"] | null;
  readonly lifecycle: RuntimeProductionLifecycleV2;
  /** Actual, producer-scoped effective definitions, including changes over time. */
  readonly definitions: readonly {
    readonly sequence: number;
    readonly applicationTick: number;
    readonly catalog: readonly AiRuntimeQueueCatalogEntryV1[];
  }[];
  readonly spatial: RuntimeProductionCausalityV1["spatialAuthority"];
  readonly routes: RuntimeProductionCausalityV1["producerRoutes"];
  readonly movements: RuntimeProductionCausalityV1["movements"];
  readonly failures: readonly string[];
  readonly gaps: readonly string[];
}
