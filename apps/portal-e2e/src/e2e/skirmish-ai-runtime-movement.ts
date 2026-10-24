import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { AiRuntimeMovementV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-movement-v1";

/** Physical endpoint diagnostics with exact execution/order ownership. No service effect or stability verdict. */
export interface RuntimeMovementV1 {
  readonly executionId: number;
  readonly started: Extract<AiRuntimeProductionFactV1, { kind: "spatial_authority" }>;
  readonly observations: readonly (Extract<AiRuntimeProductionFactV1, { kind: "spatial_authority" }> &
    { readonly spatial: AiRuntimeMovementV1 })[];
  readonly admission: Extract<AiRuntimeProductionFactV1, { kind: "spatial_authority" }> | null;
  readonly callerAttributed: boolean;
  /** Endpoint arrival belongs to the movement attempt; it does not establish the admitted task's fulfillment. */
  readonly arrival: "original_destination" | "fallback_destination" | "other_destination" | "stopped" | "unavailable";
  readonly returned: "true" | "false" | "threw" | null;
  readonly gaps: readonly string[];
}
