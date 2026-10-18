import type { MissionActionDefinition, MissionActorSpawnDefinition } from "./mission-action-definition";
import type { MissionConditionDefinition } from "./mission-condition-definition";
import type {
  MissionEncounterBranchId,
  MissionEncounterId,
  MissionEncounterWaveId,
  ScenarioSpawnSetId
} from "./campaign-content-id";
import type { CampaignDifficulty } from "./mission-difficulty-definition";

/**
 * Defines the closed mission encounter blocked spawn policy value set. Keeping this union named preserves
 * exhaustive handling and prevents incompatible free-form values at its boundaries.
 */
export type MissionEncounterBlockedSpawnPolicy = "fallback" | "delay" | "skip" | "fail";
/**
 * Defines the closed mission encounter converted actor policy value set. Keeping this union named preserves
 * exhaustive handling and prevents incompatible free-form values at its boundaries.
 */
export type MissionEncounterConvertedActorPolicy = "retain" | "release";

/**
 * Defines the structured mission encounter spawn group definition contract for this module. Its declared
 * surface makes spawn set id, actors, fallback spawn set id explicit to every consumer. Use this shared shape
 * rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface MissionEncounterSpawnGroupDefinition {
  /**
   * stable spawn set id used by {@link MissionEncounterSpawnGroupDefinition} to correlate this value with
   * related records, events, or authored content; it is not a display label.
   */
  readonly spawnSetId: ScenarioSpawnSetId;
  /**
   * collection value on {@link MissionEncounterSpawnGroupDefinition}. Its element type defines the records that
   * may cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly actors: readonly MissionActorSpawnDefinition[];
  /**
   * Optional stable fallback spawn set id used by {@link MissionEncounterSpawnGroupDefinition} to correlate this
   * value with related records, events, or authored content; it is not a display label.
   */
  readonly fallbackSpawnSetId?: ScenarioSpawnSetId;
}

/**
 * Defines the structured mission encounter branch definition contract for this module. Its declared surface
 * makes id, spawns explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters,
 * persistence, and callers remain compatible.
 */
export interface MissionEncounterBranchDefinition {
  /**
   * stable id used by {@link MissionEncounterBranchDefinition} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly id: MissionEncounterBranchId;
  /**
   * collection value on {@link MissionEncounterBranchDefinition}. Its element type defines the records that may
   * cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly spawns: readonly MissionEncounterSpawnGroupDefinition[];
}

/**
 * Defines the structured mission encounter wave definition contract for this module. Its declared surface
 * makes id, delay ticks, warning ticks, spawns, branches explicit to every consumer. Use this shared shape
 * rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface MissionEncounterWaveDefinition {
  /**
   * stable id used by {@link MissionEncounterWaveDefinition} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly id: MissionEncounterWaveId;
  /**
   * numeric delay ticks carried by {@link MissionEncounterWaveDefinition}. Its units and valid range are defined
   * by {@link MissionEncounterWaveDefinition} and must remain consistent across producers and consumers.
   */
  readonly delayTicks: number;
  /**
   * Optional numeric warning ticks carried by {@link MissionEncounterWaveDefinition}. Its units and valid range
   * are defined by {@link MissionEncounterWaveDefinition} and must remain consistent across producers and
   * consumers.
   */
  readonly warningTicks?: number;
  /**
   * collection value on {@link MissionEncounterWaveDefinition}. Its element type defines the records that may
   * cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly spawns: readonly MissionEncounterSpawnGroupDefinition[];
  /**
   * Optional collection value on {@link MissionEncounterWaveDefinition}. Its element type defines the records
   * that may cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly branches?: readonly MissionEncounterBranchDefinition[];
  /**
   * Optional collection owned by {@link MissionEncounterWaveDefinition}. Preserve the declared element contract
   * and any ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly actions?: readonly MissionActionDefinition[];
  /**
   * Optional discriminator for {@link MissionEncounterWaveDefinition}. It selects the valid branch and behavior,
   * so producers and consumers must keep it synchronized with the accompanying fields.
   */
  readonly blockedSpawnPolicy?: MissionEncounterBlockedSpawnPolicy;
  /**
   * Optional numeric blocked retry ticks carried by {@link MissionEncounterWaveDefinition}. Its units and valid
   * range are defined by {@link MissionEncounterWaveDefinition} and must remain consistent across producers and
   * consumers.
   */
  readonly blockedRetryTicks?: number;
}

/**
 * Defines the structured mission encounter override contract for this module. Its declared surface makes
 * initial delay ticks, wave size scale, warning ticks, waves explicit to every consumer. Use this shared shape
 * rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface MissionEncounterOverride {
  /**
   * Optional numeric initial delay ticks carried by {@link MissionEncounterOverride}. Its units and valid range
   * are defined by {@link MissionEncounterOverride} and must remain consistent across producers and consumers.
   */
  readonly initialDelayTicks?: number;
  /**
   * Optional numeric bound or quantity carried by {@link MissionEncounterOverride}. Interpret it in the owning
   * contract’s units and preserve its validation constraints at boundaries.
   */
  readonly waveSizeScale?: number;
  /**
   * Optional numeric warning ticks carried by {@link MissionEncounterOverride}. Its units and valid range are
   * defined by {@link MissionEncounterOverride} and must remain consistent across producers and consumers.
   */
  readonly warningTicks?: number;
  /**
   * Optional collection value on {@link MissionEncounterOverride}. Its element type defines the records that may
   * cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly waves?: readonly MissionEncounterWaveDefinition[];
}

/**
 * Defines the structured mission encounter player count override contract for this module. Its declared
 * surface makes player count explicit to every consumer. Use this shared shape rather than an ad-hoc object so
 * adapters, persistence, and callers remain compatible.
 */
export interface MissionEncounterPlayerCountOverride extends MissionEncounterOverride {
  /**
   * numeric bound or quantity carried by {@link MissionEncounterPlayerCountOverride}. Interpret it in the owning
   * contract’s units and preserve its validation constraints at boundaries.
   */
  readonly playerCount: number;
}

/**
 * Defines the structured mission encounter definition contract for this module. Its declared surface makes id,
 * start, waves, completion, initial delay ticks explicit to every consumer. Use this shared shape rather than
 * an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface MissionEncounterDefinition {
  /**
   * stable id used by {@link MissionEncounterDefinition} to correlate this value with related records, events,
   * or authored content; it is not a display label.
   */
  readonly id: MissionEncounterId;
  /**
   * start value carried by {@link MissionEncounterDefinition}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly start: MissionConditionDefinition;
  /**
   * collection value on {@link MissionEncounterDefinition}. Its element type defines the records that may cross
   * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly waves: readonly MissionEncounterWaveDefinition[];
  /**
   * Optional completion value carried by {@link MissionEncounterDefinition}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly completion?: MissionConditionDefinition;
  /**
   * Optional numeric initial delay ticks carried by {@link MissionEncounterDefinition}. Its units and valid
   * range are defined by {@link MissionEncounterDefinition} and must remain consistent across producers and
   * consumers.
   */
  readonly initialDelayTicks?: number;
  /**
   * Optional discriminator for {@link MissionEncounterDefinition}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  readonly convertedActorPolicy?: MissionEncounterConvertedActorPolicy;
  /**
   * Optional difficulty overrides value carried by {@link MissionEncounterDefinition}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly difficultyOverrides?: Readonly<Partial<Record<CampaignDifficulty, MissionEncounterOverride>>>;
  /**
   * Optional collection value on {@link MissionEncounterDefinition}. Its element type defines the records that
   * may cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly playerCountOverrides?: readonly MissionEncounterPlayerCountOverride[];
}
