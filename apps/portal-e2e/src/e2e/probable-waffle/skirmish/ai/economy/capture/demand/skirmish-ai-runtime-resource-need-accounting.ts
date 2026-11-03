import type { RuntimeResourceNeed } from "./skirmish-ai-runtime-resource-need";
import type { RuntimeResourceLiabilityFrames } from "../ownership/skirmish-ai-runtime-resource-liability-frames";

/** Partial-history diagnostics. Upper bounds describe observed accounting only; useful contribution remains activation-gated. */
export interface RuntimeResourceNeedAccounting {
  readonly need: RuntimeResourceNeed;
  readonly closedSequence: number | null;
  readonly frame: {
    readonly stockpile: number;
    readonly reservedUnspent: number;
    readonly obligationsDue: number;
  } | null;
  readonly liabilityFrames?: RuntimeResourceLiabilityFrames;
  readonly applications: readonly {
    readonly operationId: number;
    readonly entrySequence: number;
    readonly terminalSequence: number;
    readonly observedPositiveIncomeBefore: number | null;
    readonly observedUnresolvedUpperBound: number | null;
    readonly observedContributionUpperBound: number | null;
    readonly usefulContribution: null;
    readonly gaps: readonly string[];
  }[];
  readonly gaps: readonly string[];
}
