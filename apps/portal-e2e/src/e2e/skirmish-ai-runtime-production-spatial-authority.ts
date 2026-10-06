import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { RuntimeProductionCausalityV1 } from "./skirmish-ai-runtime-production-causality";

/** Actual native checks/query intervals only. No path is promoted to a snapshot-wide producer-reachable verdict. */
export interface RuntimeProductionSpatialAuthorityV1 {
  readonly placements: readonly Extract<AiRuntimeProductionFactV1, { kind: "spatial_authority" }>[];
  readonly spawns: readonly Extract<AiRuntimeProductionFactV1, { kind: "spatial_authority" }>[];
  readonly paths: readonly {
    readonly requested: Extract<AiRuntimeProductionFactV1, { kind: "spatial_authority" }>;
    readonly resolved: Extract<AiRuntimeProductionFactV1, { kind: "spatial_authority" }>;
    /** Null for initial/pre-capture/repair routes; a join requires actual native placement, delivery and application. */
    readonly constructionPlacement: Extract<AiRuntimeProductionFactV1, { kind: "spatial_authority" }> | null;
    /** Exact selected AI construct and stamped scope. Native/human/legacy routes may have placement without this link. */
    readonly constructionCommand: RuntimeProductionCausalityV1["commands"][number] | null;
    /** Same-tick actor binding only. False after movement/awaited ticks; true supplies no topology freshness proof. */
    readonly currentAtResolution: boolean;
    /** Graph-reference/update-request comparison only. Even same_observed leaves native cache/history unknown. */
    readonly topologyObservation: "same_observed" | "changed" | "unavailable";
  }[];
}
