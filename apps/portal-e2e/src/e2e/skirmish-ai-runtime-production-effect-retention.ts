import type { AiDecisionIdentity } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/ai-decision-identity";
import type { RuntimeProductionCompletionV1 } from "./skirmish-ai-runtime-production-completion";

/** Sampled native effect persistence. Accepted demand attribution supplies no strategic utility or continuous stability verdict. */
export interface RuntimeProductionEffectRetentionV1 {
  readonly completion: RuntimeProductionCompletionV1;
  readonly acceptedDecision: AiDecisionIdentity | null;
  readonly acceptedDemandId: string | null;
  readonly samples: readonly {
    readonly tick: number;
    /** Actual observer order distinguishes a pre-terminal and post-terminal snapshot within one tick. */
    readonly afterSequence: number;
    /** Present requires a ready indexed original actor or registered tech; incomplete actor capture leaves absence unavailable. */
    readonly state: "present" | "absent" | "unavailable";
    /** Actual component level at this boundary, never borrowed from the product catalog. Null for research/absence/loss. */
    readonly currentLevel: number | null;
  }[];
}
