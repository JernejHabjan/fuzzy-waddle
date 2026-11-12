import type { AiRuntimeProductionFact } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/production/lifecycle/ai-runtime-production-fact";
import type { AiRuntimeMovement } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/navigation/controls/ai-runtime-movement";

/** Physical endpoint diagnostics with exact execution/order ownership. No service effect or stability verdict. */
export interface RuntimeMovement {
  readonly executionId: number;
  readonly started: Extract<AiRuntimeProductionFact, { kind: "spatial_authority" }>;
  readonly observations: readonly (Extract<AiRuntimeProductionFact, { kind: "spatial_authority" }> &
    { readonly spatial: AiRuntimeMovement })[];
  readonly admission: Extract<AiRuntimeProductionFact, { kind: "spatial_authority" }> | null;
  readonly callerAttributed: boolean;
  /** Endpoint arrival belongs to the movement attempt; it does not establish the admitted task's fulfillment. */
  readonly arrival: "original_destination" | "fallback_destination" | "other_destination" | "stopped" | "unavailable";
  readonly returned: "true" | "false" | "threw" | null;
  readonly gaps: readonly string[];
}
