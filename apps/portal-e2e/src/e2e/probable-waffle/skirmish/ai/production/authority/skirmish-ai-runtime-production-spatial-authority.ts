import type { projectRuntimeNativeNavigation } from "../../navigation/controls/routing/skirmish-ai-runtime-native-navigation";
import type { AiRuntimeProductionFact } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/production/lifecycle/ai-runtime-production-fact";
import type { RuntimeProductionCausality } from "../decisions/skirmish-ai-runtime-production-causality";

/** Actual native checks/query intervals only. No path is promoted to a snapshot-wide producer-reachable verdict. */
export interface RuntimeProductionSpatialAuthority {
  readonly placements: readonly Extract<AiRuntimeProductionFact, { kind: "spatial_authority" }>[];
  readonly spawns: readonly Extract<AiRuntimeProductionFact, { kind: "spatial_authority" }>[];
  readonly paths: readonly {
    readonly requested: Extract<AiRuntimeProductionFact, { kind: "spatial_authority" }>;
    readonly resolved: Extract<AiRuntimeProductionFact, { kind: "spatial_authority" }>;
    /** Null for initial/pre-capture/repair routes; a join requires actual native placement, delivery and application. */
    readonly constructionPlacement: Extract<AiRuntimeProductionFact, { kind: "spatial_authority" }> | null;
    /** Exact selected AI construct and stamped scope. Native/human/legacy routes may have placement without this link. */
    readonly constructionCommand: RuntimeProductionCausality["commands"][number] | null;
    /** Same-tick actor binding only. False after movement/awaited ticks; true supplies no topology freshness proof. */
    readonly currentAtResolution: boolean;
    /** Graph-reference/update-request comparison only. Even same_observed leaves native cache/history unknown. */
    readonly topologyObservation: "same_observed" | "changed" | "unavailable";
    /** Native lookup/cache generation diagnostics, kept separate from graph observations and arrival. */
    readonly nativeNavigation: ReturnType<typeof projectRuntimeNativeNavigation>;
  }[];
}
