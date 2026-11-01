import type { ExpansionBranch } from "./skirmish-ai-expansion-branch";

/** Full EXP-02 matrix binding: safe, pressure, withdrawal and combat recovery for each faction through the original ceiling. */
export interface RuntimeExpansionPressureContract {
  readonly latestTick: 3000;
  readonly humanPlayerNumber: 1;
  readonly branchByVariant: Readonly<Record<string, Exclude<ExpansionBranch, "served">>>;
}
