import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { RuntimeRouteOrderLineageV1 } from "./skirmish-ai-runtime-route-order-lineage";

/** Exact native service-attempt ownership. A callee amount cannot supply resource credit or cargo provenance. */
export interface RuntimeServiceAttemptV1 {
  readonly attemptId: number;
  readonly started: Extract<AiRuntimeProductionFactV1, { kind: "spatial_authority" }>;
  readonly terminal: Extract<AiRuntimeProductionFactV1, { kind: "spatial_authority" }> | null;
  readonly admission: RuntimeRouteOrderLineageV1["admission"];
  readonly callerAttributed: boolean;
  /** Only a paired native resolution supplies this; zero is valid and rejection/partial work stays null. */
  readonly nativeResultAmount: number | null;
  readonly serviceCommand: RuntimeRouteOrderLineageV1["serviceCommand"];
  readonly selectedDemand: RuntimeRouteOrderLineageV1["selectedDemand"];
  readonly gaps: readonly string[];
}
