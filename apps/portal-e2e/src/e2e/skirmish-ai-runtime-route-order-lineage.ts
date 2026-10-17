import type { AiDemandV1 } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/contracts/ai-plan-contracts";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { RuntimeProductionCausalityV1 } from "./skirmish-ai-runtime-production-causality";
import type { AiRuntimeRouteCallerV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-route-caller-v1";

/** Captured query/order origin and dated demand, separately from task fulfillment or continuous execution. */
export interface RuntimeRouteOrderLineageV1 {
  readonly admission: Extract<AiRuntimeProductionFactV1, { kind: "spatial_authority" }> | null;
  readonly rally: Extract<AiRuntimeProductionFactV1, { kind: "spatial_authority" }> | null;
  readonly serviceCommand: RuntimeProductionCausalityV1["commands"][number] | null;
  readonly selectedDemand: { readonly selectedSequence: number; readonly selectedTick: number; readonly demand: AiDemandV1 } | null;
  /** Equality of these two detached current-order samples, never continuous execution or unchanged actor lifetime. */
  readonly sameCurrentOrderAtTerminal: boolean;
  /** Detached native use-site observation; never replaced with a current-order sample. */
  readonly queryCaller: AiRuntimeRouteCallerV1 | null;
  /** Valid paired caller/order and earlier admission without an observed lifetime fence. No arrival claim. */
  readonly queryCallerAttributed: boolean;
  readonly gaps: readonly string[];
}
