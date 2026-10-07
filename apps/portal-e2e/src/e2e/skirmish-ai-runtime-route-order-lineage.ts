import type { AiDemandV1 } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/contracts/ai-plan-contracts";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { RuntimeProductionCausalityV1 } from "./skirmish-ai-runtime-production-causality";

/** A native order's origin and dated selected demand, separately from any claim that a route executes that order. */
export interface RuntimeRouteOrderLineageV1 {
  readonly admission: Extract<AiRuntimeProductionFactV1, { kind: "spatial_authority" }> | null;
  readonly rally: Extract<AiRuntimeProductionFactV1, { kind: "spatial_authority" }> | null;
  readonly serviceCommand: RuntimeProductionCausalityV1["commands"][number] | null;
  readonly selectedDemand: { readonly selectedSequence: number; readonly selectedTick: number; readonly demand: AiDemandV1 } | null;
  /** Equality of these two detached current-order samples, never continuous execution or unchanged actor lifetime. */
  readonly sameCurrentOrderAtTerminal: boolean;
  readonly queryCallerAttributed: false;
  readonly gaps: readonly string[];
}
