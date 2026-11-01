import type { AiRuntimeProductionFact } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact";
import type { AiRuntimeInitialConstruction } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-initial-construction";
import type { RuntimeProductionCausality } from "./skirmish-ai-runtime-production-causality";

/** Historical site ownership only. Every refund/teardown remains distinct; admission never proves payment or cancellation intent. */
export interface RuntimeConstructionLineage {
  readonly boundary: Extract<AiRuntimeProductionFact, { kind: "construction_authority" }>;
  /** capture_initial means present at installation, with all earlier placement/payment/setup ownership unknown. */
  readonly origin: "placement" | "capture_initial" | "restore" | "unavailable";
  readonly placement: Extract<AiRuntimeProductionFact, { kind: "spatial_authority" }> | null;
  /** Exact retrospective admission, including automatic sites without paths; no callback-time decision availability claim. */
  readonly commandScope: RuntimeProductionCausality["commands"][number] | null;
  /** Actual applied outcome naming the site; null for illegal placement or missing/failed application. */
  readonly application: Extract<AiRuntimeProductionFact, { kind: "outcome" }> | null;
  readonly initialSite: AiRuntimeInitialConstruction["sites"][number] | null;
  readonly gaps: readonly string[];
}
