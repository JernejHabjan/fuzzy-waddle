import type { projectRuntimeNativeNavigation } from "./skirmish-ai-runtime-native-navigation";
import type { AiRuntimeProductionFact } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/production/lifecycle/ai-runtime-production-fact";
import type { RuntimeProductionCausality } from "../../../production/decisions/skirmish-ai-runtime-production-causality";
import type { RuntimeProductionCompletion } from "../../../production/completion/skirmish-ai-runtime-production-completion";
import type { RuntimeRouteOrderLineage } from "../commands/skirmish-ai-runtime-route-order-lineage";

/** Query/output diagnostics, never full producer reachability or useful-effect evidence. Capture-wide joins are retrospective. */
export interface RuntimeProducerRoutes {
  readonly outputs: readonly {
    readonly boundary: Extract<AiRuntimeProductionFact, { kind: "spatial_authority" }>;
    readonly spawn: Extract<AiRuntimeProductionFact, { kind: "spatial_authority" }> | null;
    readonly completion: RuntimeProductionCompletion | null;
    /** Exact production admission/selected demand. It does not attribute later movement to the original demand. */
    readonly commandScope: RuntimeProductionCausality["commands"][number] | null;
    readonly gaps: readonly string[];
  }[];
  readonly paths: readonly {
    readonly requested: Extract<AiRuntimeProductionFact, { kind: "spatial_authority" }>;
    readonly terminal: Extract<AiRuntimeProductionFact, { kind: "spatial_authority" }>;
    /** Exact earlier output ID plus actual object binding; unavailable after observed restore/reuse. */
    readonly output: RuntimeProducerRoutes["outputs"][number] | null;
    /** Same-tick actor/scene/index binding at the terminal, including failure terminals; supplies no route freshness. */
    readonly currentAtResolution: boolean;
    readonly topologyObservation: "same_observed" | "changed" | "unavailable";
    /** Native lookup/cache generation diagnostics, kept separate from graph observations and arrival. */
    readonly nativeNavigation: ReturnType<typeof projectRuntimeNativeNavigation>;
    readonly orderLineage: RuntimeRouteOrderLineage;
    readonly gaps: readonly string[];
  }[];
}
