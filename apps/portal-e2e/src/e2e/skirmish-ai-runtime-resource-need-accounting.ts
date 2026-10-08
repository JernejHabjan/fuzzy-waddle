import type { RuntimeResourceNeedV1 } from "./skirmish-ai-runtime-resource-need";

/** Partial-history diagnostics. Upper bounds describe observed accounting only; useful contribution remains activation-gated. */
export interface RuntimeResourceNeedAccountingV1 {
  readonly need: RuntimeResourceNeedV1;
  readonly closedSequence: number | null;
  readonly frame: {
    readonly stockpile: number;
    readonly reservedUnspent: number;
    readonly obligationsDue: number;
  } | null;
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
