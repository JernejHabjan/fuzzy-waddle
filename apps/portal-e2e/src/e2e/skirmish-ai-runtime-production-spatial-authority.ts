import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";

/** Actual native checks/query intervals only. No path is promoted to a snapshot-wide producer-reachable verdict. */
export interface RuntimeProductionSpatialAuthorityV1 {
  readonly placements: readonly Extract<AiRuntimeProductionFactV1, { kind: "spatial_authority" }>[];
  readonly spawns: readonly Extract<AiRuntimeProductionFactV1, { kind: "spatial_authority" }>[];
  readonly paths: readonly {
    readonly requested: Extract<AiRuntimeProductionFactV1, { kind: "spatial_authority" }>;
    readonly resolved: Extract<AiRuntimeProductionFactV1, { kind: "spatial_authority" }>;
    /** Null for initial/pre-capture/repair routes; a join requires actual native placement, delivery and application. */
    readonly constructionPlacement: Extract<AiRuntimeProductionFactV1, { kind: "spatial_authority" }> | null;
    /** Same-tick actor binding only. False after movement/awaited ticks; true supplies no topology freshness proof. */
    readonly currentAtResolution: boolean;
  }[];
}
