import type { AiDemand } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/contracts/planning/ai-plan-contracts";
import type { AiRuntimeProductionFact } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/production/lifecycle/ai-runtime-production-fact";
import type { RuntimeProductionCausality } from "../../../production/decisions/skirmish-ai-runtime-production-causality";
import type { AiRuntimeRouteCaller } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/navigation/controls/ai-runtime-route-caller";

/** Captured query/order origin and dated demand, separately from task fulfillment or continuous execution. */
export interface RuntimeRouteOrderLineage {
  readonly admission: Extract<AiRuntimeProductionFact, { kind: "spatial_authority" }> | null;
  readonly rally: Extract<AiRuntimeProductionFact, { kind: "spatial_authority" }> | null;
  readonly serviceCommand: RuntimeProductionCausality["commands"][number] | null;
  readonly selectedDemand: { readonly selectedSequence: number; readonly selectedTick: number; readonly demand: AiDemand } | null;
  /** Equality of these two detached current-order samples, never continuous execution or unchanged actor lifetime. */
  readonly sameCurrentOrderAtTerminal: boolean;
  /** Detached native use-site observation; never replaced with a current-order sample. */
  readonly queryCaller: AiRuntimeRouteCaller | null;
  /** Valid paired caller/order and earlier admission without an observed lifetime fence. No arrival claim. */
  readonly queryCallerAttributed: boolean;
  readonly gaps: readonly string[];
}
