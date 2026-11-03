/** Full native case binding. Branch names select fixed independent predicates, never interpreted prose. */
export interface RuntimeNativeScenarioContract {
  readonly schemaVersion: 1;
  readonly scenarioId: string;
  readonly latestTick: number;
  readonly humanPlayerNumber: 1;
  readonly branchByVariant: Readonly<Record<string, string>>;
}
