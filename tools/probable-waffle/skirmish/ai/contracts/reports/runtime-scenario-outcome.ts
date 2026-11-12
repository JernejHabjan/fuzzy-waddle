/** Small physical-outcome projection used by report indexes; raw proof remains in the retained artifact. */
export interface RuntimeScenarioOutcome {
  scenarioId: string;
  passed?: boolean;
  failures?: string[];
  variants?: { variantId?: string; stopReason?: string }[];
}
