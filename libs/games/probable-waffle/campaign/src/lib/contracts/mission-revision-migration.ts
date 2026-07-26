/**
 * Defines the structured mission revision migration contract for this module. Its declared surface makes from
 * revision, to revision, rename phase ids, rename objective ids, rename fact ids explicit to every consumer.
 * Use this shared shape rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface MissionRevisionMigration {
  /**
   * compatibility from revision for {@link MissionRevisionMigration}. Consumers use it to choose validation,
   * migration, or conflict-handling rules instead of guessing the payload shape.
   */
  readonly fromRevision: number;
  /**
   * compatibility to revision for {@link MissionRevisionMigration}. Consumers use it to choose validation,
   * migration, or conflict-handling rules instead of guessing the payload shape.
   */
  readonly toRevision: number;
  /**
   * Optional collection owned by {@link MissionRevisionMigration}. Preserve the declared element contract and
   * any ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly renamePhaseIds?: Readonly<Record<string, string>>;
  /**
   * Optional collection owned by {@link MissionRevisionMigration}. Preserve the declared element contract and
   * any ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly renameObjectiveIds?: Readonly<Record<string, string>>;
  /**
   * Optional collection owned by {@link MissionRevisionMigration}. Preserve the declared element contract and
   * any ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly renameFactIds?: Readonly<Record<string, string>>;
  /**
   * Optional collection owned by {@link MissionRevisionMigration}. Preserve the declared element contract and
   * any ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly renameCounterIds?: Readonly<Record<string, string>>;
}
