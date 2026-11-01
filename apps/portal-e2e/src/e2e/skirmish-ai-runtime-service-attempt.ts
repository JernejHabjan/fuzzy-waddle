import type { AiRuntimeProductionFact } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact";
import type { RuntimeRouteOrderLineage } from "./skirmish-ai-runtime-route-order-lineage";

/** Exact native service-attempt ownership. A callee amount cannot supply resource credit or cargo provenance. */
export interface RuntimeServiceAttempt {
  readonly attemptId: number;
  readonly started: Extract<AiRuntimeProductionFact, { kind: "spatial_authority" }>;
  readonly terminal: Extract<AiRuntimeProductionFact, { kind: "spatial_authority" }> | null;
  readonly admission: RuntimeRouteOrderLineage["admission"];
  readonly callerAttributed: boolean;
  /** Only a paired native resolution supplies this; zero is valid and rejection/partial work stays null. */
  readonly nativeResultAmount: number | null;
  readonly serviceCommand: RuntimeRouteOrderLineage["serviceCommand"];
  readonly selectedDemand: RuntimeRouteOrderLineage["selectedDemand"];
  readonly gaps: readonly string[];
}
