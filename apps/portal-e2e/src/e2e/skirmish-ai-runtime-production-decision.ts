import type { AiDecisionIdentity } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/ai-decision-identity";
import type { AiDecisionInput } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/ai-decision-input";
import type { RuntimeProductionFairInput } from "./skirmish-ai-runtime-production-fair-input";

/** Selected planner boundary, including empty decisions. Observation age never substitutes for actual cadence. */
export interface RuntimeProductionDecision {
  readonly selectedSequence: number;
  readonly selectedTick: number;
  readonly identity: AiDecisionIdentity;
  readonly cadence: AiDecisionInput["cadence"];
  readonly observationAgeTicks: number;
  /** Actual same-generation definition catalog consumed by the managers, not a producer price table. */
  readonly capabilityCatalog: NonNullable<AiDecisionInput["capabilityCatalog"]>;
  readonly fairInput: RuntimeProductionFairInput;
}
