/** Fixed paired-world invariants, checked independently of selected AI explanations. */
export interface ExpansionPressureAssertion {
  maximumTick?: number;
  requiredAiFactions: readonly string[];
  requiredExpansionPressure?: {
    latestTick: number;
    humanPlayerNumber: number;
    branchByVariant: Readonly<Record<string, string>>;
  };
}
