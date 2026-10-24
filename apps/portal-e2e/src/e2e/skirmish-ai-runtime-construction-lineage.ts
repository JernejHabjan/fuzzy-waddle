import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { AiRuntimeInitialConstructionV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-initial-construction-v1";
import type { RuntimeProductionCausalityV1 } from "./skirmish-ai-runtime-production-causality";

/** Historical site ownership only. Every refund/teardown remains distinct; admission never proves payment or cancellation intent. */
export interface RuntimeConstructionLineageV1 {
  readonly boundary: Extract<AiRuntimeProductionFactV1, { kind: "construction_authority" }>;
  /** capture_initial means present at installation, with all earlier placement/payment/setup ownership unknown. */
  readonly origin: "placement" | "capture_initial" | "restore" | "unavailable";
  readonly placement: Extract<AiRuntimeProductionFactV1, { kind: "spatial_authority" }> | null;
  /** Exact retrospective admission, including automatic sites without paths; no callback-time decision availability claim. */
  readonly commandScope: RuntimeProductionCausalityV1["commands"][number] | null;
  /** Actual applied outcome naming the site; null for illegal placement or missing/failed application. */
  readonly application: Extract<AiRuntimeProductionFactV1, { kind: "outcome" }> | null;
  readonly initialSite: AiRuntimeInitialConstructionV1["sites"][number] | null;
  readonly gaps: readonly string[];
}
