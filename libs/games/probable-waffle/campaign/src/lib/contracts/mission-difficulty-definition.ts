/**
 * Defines the closed campaign difficulty value set. Keeping this union named preserves exhaustive handling and
 * prevents incompatible free-form values at its boundaries.
 */
export type CampaignDifficulty = "story" | "normal" | "hard";

/**
 * Defines the structured mission difficulty overrides contract for this module. Its declared surface makes
 * starting resource scale, wave size scale, warning ticks, damage scale, ai aggression scale explicit to every
 * consumer. Use this shared shape rather than an ad-hoc object so adapters, persistence, and callers remain
 * compatible.
 */
export interface MissionDifficultyOverrides {
  /**
   * Optional numeric bound or quantity carried by {@link MissionDifficultyOverrides}. Interpret it in the owning
   * contract’s units and preserve its validation constraints at boundaries.
   */
  readonly startingResourceScale?: number;
  /**
   * Optional numeric bound or quantity carried by {@link MissionDifficultyOverrides}. Interpret it in the owning
   * contract’s units and preserve its validation constraints at boundaries.
   */
  readonly waveSizeScale?: number;
  /**
   * Optional numeric warning ticks carried by {@link MissionDifficultyOverrides}. Its units and valid range are
   * defined by {@link MissionDifficultyOverrides} and must remain consistent across producers and consumers.
   */
  readonly warningTicks?: number;
  /**
   * Optional numeric bound or quantity carried by {@link MissionDifficultyOverrides}. Interpret it in the owning
   * contract’s units and preserve its validation constraints at boundaries.
   */
  readonly damageScale?: number;
  /**
   * Optional numeric bound or quantity carried by {@link MissionDifficultyOverrides}. Interpret it in the owning
   * contract’s units and preserve its validation constraints at boundaries.
   */
  readonly aiAggressionScale?: number;
}

/**
 * Defines the structured mission difficulty definition contract for this module. Its declared surface makes
 * story, normal, hard, player count overrides explicit to every consumer. Use this shared shape rather than an
 * ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface MissionDifficultyDefinition {
  /**
   * story value carried by {@link MissionDifficultyDefinition}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly story: MissionDifficultyOverrides;
  /**
   * normal value carried by {@link MissionDifficultyDefinition}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly normal: MissionDifficultyOverrides;
  /**
   * hard value carried by {@link MissionDifficultyDefinition}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly hard: MissionDifficultyOverrides;
  /**
   * Optional collection value on {@link MissionDifficultyDefinition}. Its element type defines the records that
   * may cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly playerCountOverrides?: readonly MissionPlayerCountDifficultyOverride[];
}

/**
 * Defines the structured mission player count difficulty override contract for this module. Its declared
 * surface makes player count, story, normal, hard explicit to every consumer. Use this shared shape rather
 * than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface MissionPlayerCountDifficultyOverride {
  /**
   * numeric bound or quantity carried by {@link MissionPlayerCountDifficultyOverride}. Interpret it in the
   * owning contract’s units and preserve its validation constraints at boundaries.
   */
  readonly playerCount: number;
  /**
   * Optional story value carried by {@link MissionPlayerCountDifficultyOverride}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly story?: MissionDifficultyOverrides;
  /**
   * Optional normal value carried by {@link MissionPlayerCountDifficultyOverride}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly normal?: MissionDifficultyOverrides;
  /**
   * Optional hard value carried by {@link MissionPlayerCountDifficultyOverride}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly hard?: MissionDifficultyOverrides;
}
