import type { AiDecisionIdentity } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/ai-decision-identity";
import type { AiDecisionInputV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/ai-decision-input-v1";
import type { RuntimeProductionFairInputV1 } from "./skirmish-ai-runtime-production-fair-input";

/** Selected planner boundary, including empty decisions. Observation age never substitutes for actual cadence. */
export interface RuntimeProductionDecisionV1 {
  readonly selectedSequence: number;
  readonly selectedTick: number;
  readonly identity: AiDecisionIdentity;
  readonly cadence: AiDecisionInputV1["cadence"];
  readonly observationAgeTicks: number;
  /** Actual same-generation definition catalog consumed by the managers, not a producer price table. */
  readonly capabilityCatalog: NonNullable<AiDecisionInputV1["capabilityCatalog"]>;
  readonly fairInput: RuntimeProductionFairInputV1;
}
