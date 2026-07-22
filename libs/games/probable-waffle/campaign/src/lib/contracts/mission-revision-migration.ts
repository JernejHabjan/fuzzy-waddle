export interface MissionRevisionMigration {
  readonly fromRevision: number;
  readonly toRevision: number;
  readonly renamePhaseIds?: Readonly<Record<string, string>>;
  readonly renameObjectiveIds?: Readonly<Record<string, string>>;
  readonly renameFactIds?: Readonly<Record<string, string>>;
  readonly renameCounterIds?: Readonly<Record<string, string>>;
}
