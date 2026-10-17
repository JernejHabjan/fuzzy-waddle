import type { AiGatheringSelection } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/planning/ai-gathering-selection";

/** Accepted aggregate selection generation, not an individual production-demand obligation or usefulness verdict. */
export interface RuntimeResourceNeedV1 {
  readonly selectedSequence: number;
  readonly selection: AiGatheringSelection;
  /** Native units; null when no dated positive quantitative need is established. */
  readonly grossUnmet: number | null;
  readonly gaps: readonly string[];
}
