import type { projectRuntimeNativeNavigation } from "./skirmish-ai-runtime-native-navigation";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { RuntimeProductionCausalityV1 } from "./skirmish-ai-runtime-production-causality";
import type { RuntimeProductionCompletionV1 } from "./skirmish-ai-runtime-production-completion";
import type { RuntimeRouteOrderLineageV1 } from "./skirmish-ai-runtime-route-order-lineage";

/** Query/output diagnostics, never full producer reachability or useful-effect evidence. Capture-wide joins are retrospective. */
export interface RuntimeProducerRoutesV1 {
  readonly outputs: readonly {
    readonly boundary: Extract<AiRuntimeProductionFactV1, { kind: "spatial_authority" }>;
    readonly spawn: Extract<AiRuntimeProductionFactV1, { kind: "spatial_authority" }> | null;
    readonly completion: RuntimeProductionCompletionV1 | null;
    /** Exact production admission/selected demand. It does not attribute later movement to the original demand. */
    readonly commandScope: RuntimeProductionCausalityV1["commands"][number] | null;
    readonly gaps: readonly string[];
  }[];
  readonly paths: readonly {
    readonly requested: Extract<AiRuntimeProductionFactV1, { kind: "spatial_authority" }>;
    readonly terminal: Extract<AiRuntimeProductionFactV1, { kind: "spatial_authority" }>;
    /** Exact earlier output ID plus actual object binding; unavailable after observed restore/reuse. */
    readonly output: RuntimeProducerRoutesV1["outputs"][number] | null;
    /** Same-tick actor/scene/index binding at the terminal, including failure terminals; supplies no route freshness. */
    readonly currentAtResolution: boolean;
    readonly topologyObservation: "same_observed" | "changed" | "unavailable";
    /** Native lookup/cache generation diagnostics, kept separate from graph observations and arrival. */
    readonly nativeNavigation: ReturnType<typeof projectRuntimeNativeNavigation>;
    readonly orderLineage: RuntimeRouteOrderLineageV1;
    readonly gaps: readonly string[];
  }[];
}
