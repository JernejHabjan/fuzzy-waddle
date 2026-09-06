import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import { ResourceType } from "../../probable-waffle/resource-type-definition";
import { ObjectNames } from "./object-names";
import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import type { PrerequisiteType } from "./prereque-type";
import type { StatusEffectData } from "../../probable-waffle/status-effect";
import type { PreRequirement } from "./pre-requirement";
import type { ResearchType } from "./research-type";
import type { GameCommandOutcome } from "./game-command";

/**
 * Defines the structured vision component data contract for this module. Its declared surface makes visibility
 * by current player explicit to every consumer. Use this shared shape rather than an ad-hoc object so
 * adapters, persistence, and callers remain compatible.
 */
export interface VisionComponentData {
  /**
   * Optional visibility by current player value carried by {@link VisionComponentData}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  visibilityByCurrentPlayer?: boolean;
}

/**
 * Defines the structured attack component data contract for this module. Its declared surface makes remaining
 * cooldown, current attack index explicit to every consumer. Use this shared shape rather than an ad-hoc
 * object so adapters, persistence, and callers remain compatible.
 */
export interface AttackComponentData {
  /**
   * Optional numeric remaining cooldown carried by {@link AttackComponentData}. Its units and valid range are
   * defined by {@link AttackComponentData} and must remain consistent across producers and consumers.
   */
  remainingCooldown?: number;
  /**
   * Optional numeric current attack index carried by {@link AttackComponentData}. Its units and valid range are
   * defined by {@link AttackComponentData} and must remain consistent across producers and consumers.
   */
  currentAttackIndex?: number;
}

/**
 * Defines the structured healing component data contract for this module. Its declared surface makes remaining
 * cooldown explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters,
 * persistence, and callers remain compatible.
 */
export interface HealingComponentData {
  /**
   * Optional numeric remaining cooldown carried by {@link HealingComponentData}. Its units and valid range are
   * defined by {@link HealingComponentData} and must remain consistent across producers and consumers.
   */
  remainingCooldown?: number;
}

/**
 * Defines the structured builder component data contract for this module. Its declared surface makes remaining
 * cooldown, assigned construction site id explicit to every consumer. Use this shared shape rather than an
 * ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface BuilderComponentData {
  /**
   * Optional numeric remaining cooldown carried by {@link BuilderComponentData}. Its units and valid range are
   * defined by {@link BuilderComponentData} and must remain consistent across producers and consumers.
   */
  remainingCooldown?: number;
  /**
   * Optional stable assigned construction site id used by {@link BuilderComponentData} to correlate this value
   * with related records, events, or authored content; it is not a display label.
   */
  assignedConstructionSiteId?: string;
}

/**
 * Defines the structured gatherer component data contract for this module. Its declared surface makes carried
 * resource amount, carried resource type, remaining cooldown explicit to every consumer. Use this shared shape
 * rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface GathererComponentData {
  /**
   * Optional numeric bound or quantity carried by {@link GathererComponentData}. Interpret it in the owning
   * contract’s units and preserve its validation constraints at boundaries.
   */
  carriedResourceAmount?: number;
  /**
   * Optional discriminator for {@link GathererComponentData}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  carriedResourceType?: ResourceType | null;
  /**
   * Optional numeric remaining cooldown carried by {@link GathererComponentData}. Its units and valid range are
   * defined by {@link GathererComponentData} and must remain consistent across producers and consumers.
   */
  remainingCooldown?: number;
}

/**
 * Defines the structured container component data contract for this module. Its declared surface makes
 * contained ids explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters,
 * persistence, and callers remain compatible.
 */
export interface ContainerComponentData {
  /**
   * Optional collection owned by {@link ContainerComponentData}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  containedIds?: ActorId[];
}

/**
 * Defines the structured resource drain component data contract for this module. Its declared surface makes
 * current capacity explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters,
 * persistence, and callers remain compatible.
 */
export interface ResourceDrainComponentData {
  /**
   * Optional numeric bound or quantity carried by {@link ResourceDrainComponentData}. Interpret it in the owning
   * contract’s units and preserve its validation constraints at boundaries.
   */
  currentCapacity?: number;
}

/**
 * Defines the structured resource source component data contract for this module. Its declared surface makes
 * current resources explicit to every consumer. Use this shared shape rather than an ad-hoc object so
 * adapters, persistence, and callers remain compatible.
 */
export interface ResourceSourceComponentData {
  /**
   * Optional numeric current resources carried by {@link ResourceSourceComponentData}. Its units and valid range
   * are defined by {@link ResourceSourceComponentData} and must remain consistent across producers and
   * consumers.
   */
  currentResources?: number;
}

/**
 * Defines the structured production queue item data contract for this module. Its declared surface makes name,
 * remaining time explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters,
 * persistence, and callers remain compatible.
 */
export interface ProductionQueueItemData {
  /**
   * human-facing name for {@link ProductionQueueItemData}. It supports UI, narration, or diagnostics and must
   * not be used as the stable identity of the record.
   */
  name: ObjectNames;
  /**
   * temporal value for {@link ProductionQueueItemData}. It anchors ordering, expiry, or presentation timing and
   * must use the time domain declared by the enclosing contract.
   */
  remainingTime: number; // ms remaining for this specific item
}

/**
 * Defines the structured production component data contract for this module. Its declared surface makes queue,
 * is producing, rally point explicit to every consumer. Use this shared shape rather than an ad-hoc object so
 * adapters, persistence, and callers remain compatible.
 */
export interface ProductionComponentData {
  /**
   * Optional collection value on {@link ProductionComponentData}. Its element type defines the records that may
   * cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  queue?: ProductionQueueItemData[]; // Array of items with per-item progress
  /**
   * Optional boolean policy/value on {@link ProductionComponentData} that explicitly controls whether the
   * associated behavior is active; do not infer it from unrelated state.
   */
  isProducing?: boolean;
  /**
   * Optional rally point value carried by {@link ProductionComponentData}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  rallyPoint?: RallyPointComponentData;
}

/**
 * Defines the structured rally point component data contract for this module. Its declared surface makes tile
 * vec3, world vec3, actor id explicit to every consumer. Use this shared shape rather than an ad-hoc object so
 * adapters, persistence, and callers remain compatible.
 */
export interface RallyPointComponentData {
  /**
   * Optional tile vec3 value carried by {@link RallyPointComponentData}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  tileVec3?: Vector3Simple;
  /**
   * Optional world vec3 value carried by {@link RallyPointComponentData}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  worldVec3?: Vector3Simple;
  /**
   * Optional stable actor id used by {@link RallyPointComponentData} to correlate this value with related
   * records, events, or authored content; it is not a display label.
   */
  actorId?: ActorId;
}

/**
 * Defines the structured actor translate component data contract for this module. Its declared surface makes
 * x, y, z, facing angle explicit to every consumer. Use this shared shape rather than an ad-hoc object so
 * adapters, persistence, and callers remain compatible.
 */
export interface ActorTranslateComponentData {
  /**
   * Optional numeric x carried by {@link ActorTranslateComponentData}. Its units and valid range are defined by
   * {@link ActorTranslateComponentData} and must remain consistent across producers and consumers.
   */
  x?: number;
  /**
   * Optional numeric y carried by {@link ActorTranslateComponentData}. Its units and valid range are defined by
   * {@link ActorTranslateComponentData} and must remain consistent across producers and consumers.
   */
  y?: number;
  /**
   * Optional numeric z carried by {@link ActorTranslateComponentData}. Its units and valid range are defined by
   * {@link ActorTranslateComponentData} and must remain consistent across producers and consumers.
   */
  z?: number;
  /**
   * Optional numeric facing angle carried by {@link ActorTranslateComponentData}. Its units and valid range are
   * defined by {@link ActorTranslateComponentData} and must remain consistent across producers and consumers.
   */
  facingAngle?: number;
}

/**
 * Defines the structured navigable component data contract for this module. Its declared surface makes speed,
 * pathing radius explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters,
 * persistence, and callers remain compatible.
 */
export interface NavigableComponentData {
  /**
   * Optional numeric speed carried by {@link NavigableComponentData}. Its units and valid range are defined by
   * {@link NavigableComponentData} and must remain consistent across producers and consumers.
   */
  speed?: number;
  /**
   * Optional numeric pathing radius carried by {@link NavigableComponentData}. Its units and valid range are
   * defined by {@link NavigableComponentData} and must remain consistent across producers and consumers.
   */
  pathingRadius?: number;
}

/**
 * Defines the structured representable component data contract for this module. Its declared surface makes
 * logical world transform explicit to every consumer. Use this shared shape rather than an ad-hoc object so
 * adapters, persistence, and callers remain compatible.
 */
export interface RepresentableComponentData {
  /**
   * Optional logical world transform value carried by {@link RepresentableComponentData}. Its declared type is
   * the compatibility boundary for producers, validators, and consumers; do not replace it with a broader
   * inferred shape.
   */
  logicalWorldTransform?: Vector3Simple;
}

/**
 * Defines the structured owner component data contract for this module. Its declared surface makes owner id
 * explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters, persistence, and
 * callers remain compatible.
 */
export interface OwnerComponentData {
  /**
   * Optional stable owner id used by {@link OwnerComponentData} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  ownerId?: number;
}

/**
 * Defines the structured selectable component data contract for this module. Its declared surface makes
 * selected explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters,
 * persistence, and callers remain compatible.
 */
export interface SelectableComponentData {
  /**
   * Optional selected value carried by {@link SelectableComponentData}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  selected?: boolean;
}

/**
 * Defines the structured id component data contract for this module. Its declared surface makes id explicit to
 * every consumer. Use this shared shape rather than an ad-hoc object so adapters, persistence, and callers
 * remain compatible.
 */
export interface IdComponentData {
  /**
   * Optional stable id used by {@link IdComponentData} to correlate this value with related records, events, or
   * authored content; it is not a display label.
   */
  id?: string;
}

/** Defines the scenario actor reference data contract used by this module; its declared members form the compatible boundary for linked consumers. */
export interface ScenarioActorReferenceData {
  /**
   * stable role id used by {@link ScenarioActorReferenceData} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  roleId: string;
  /**
   * collection value on {@link ScenarioActorReferenceData}. Its element type defines the records that may cross
   * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  tags: string[];
}

/**
 * Defines the structured backboard component data contract for this module. Its declared surface makes
 * blackboard explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters,
 * persistence, and callers remain compatible.
 */
export interface BackboardComponentData {
  /**
   * keyed/nested blackboard structure owned by {@link BackboardComponentData}. Keep its keys and value contract
   * explicit so callers cannot smuggle a broader shape across this boundary.
   */
  blackboard: Record<string, any>;
}

/**
 * Defines the structured housing component data contract for this module. Its declared surface makes housing
 * provided explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters,
 * persistence, and callers remain compatible.
 */
export interface HousingComponentData {
  /**
   * Optional housing provided value carried by {@link HousingComponentData}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  housingProvided?: boolean;
}

// Selection group data for save/load
/**
 * Defines the structured selection group data contract for this module. Its declared surface makes group key,
 * actor ids, timestamp explicit to every consumer. Use this shared shape rather than an ad-hoc object so
 * adapters, persistence, and callers remain compatible.
 */
export interface SelectionGroupData {
  /**
   * stable group key used by {@link SelectionGroupData} to correlate this value with related records, events, or
   * authored content; it is not a display label.
   */
  groupKey: number;
  /**
   * collection owned by {@link SelectionGroupData}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  actorIds: ActorId[];
  /**
   * temporal value for {@link SelectionGroupData}. It anchors ordering, expiry, or presentation timing and must
   * use the time domain declared by the enclosing contract.
   */
  timestamp: number;
}

// Camera state data for save/load
/**
 * Defines the structured camera state data contract for this module. Its declared surface makes scroll x,
 * scroll y, zoom explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters,
 * persistence, and callers remain compatible.
 */
export interface CameraStateData {
  /**
   * Optional numeric scroll x carried by {@link CameraStateData}. Its units and valid range are defined by
   * {@link CameraStateData} and must remain consistent across producers and consumers.
   */
  scrollX?: number;
  /**
   * Optional numeric scroll y carried by {@link CameraStateData}. Its units and valid range are defined by
   * {@link CameraStateData} and must remain consistent across producers and consumers.
   */
  scrollY?: number;
  /**
   * Optional numeric zoom carried by {@link CameraStateData}. Its units and valid range are defined by {@link
   * CameraStateData} and must remain consistent across producers and consumers.
   */
  zoom?: number;
}
// Player AI blackboard data for save/load
/**
 * Defines the structured player ai blackboard data contract for this module. Its declared surface makes
 * current strategy, base size, map fully explored, wants to surrender, surrender offered at explicit to every
 * consumer. Use this shared shape rather than an ad-hoc object so adapters, persistence, and callers remain
 * compatible.
 */
export interface PlayerAiBlackboardData {
  // ---- Legacy / top-level ----
  /**
   * Optional string current strategy carried by {@link PlayerAiBlackboardData}. Treat it according to the owning
   * contract’s validation and presentation rules rather than assuming it is a stable identifier.
   */
  currentStrategy?: string;
  /**
   * Optional numeric bound or quantity carried by {@link PlayerAiBlackboardData}. Interpret it in the owning
   * contract’s units and preserve its validation constraints at boundaries.
   */
  baseSize?: number;
  /**
   * Optional map fully explored value carried by {@link PlayerAiBlackboardData}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  mapFullyExplored?: boolean;
  /**
   * Optional wants to surrender value carried by {@link PlayerAiBlackboardData}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  wantsToSurrender?: boolean;
  /**
   * Optional temporal value for {@link PlayerAiBlackboardData}. It anchors ordering, expiry, or presentation
   * timing and must use the time domain declared by the enclosing contract.
   */
  surrenderOfferedAt?: number;
  /**
   * Optional surrender rejected value carried by {@link PlayerAiBlackboardData}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  surrenderRejected?: boolean;
  /**
   * Optional numeric active tech upgrades carried by {@link PlayerAiBlackboardData}. Its units and valid range
   * are defined by {@link PlayerAiBlackboardData} and must remain consistent across producers and consumers.
   */
  activeTechUpgrades?: number;
  /**
   * Optional temporal value for {@link PlayerAiBlackboardData}. It anchors ordering, expiry, or presentation
   * timing and must use the time domain declared by the enclosing contract.
   */
  lastTechUpgradeAt?: number;

  // ---- Economy ----
  /**
   * Optional keyed/nested economy structure owned by {@link PlayerAiBlackboardData}. Keep its keys and value
   * contract explicit so callers cannot smuggle a broader shape across this boundary.
   */
  economy?: {
    /**
     * keyed/nested resources structure owned by {@link PlayerAiBlackboardData}. Keep its keys and value contract
     * explicit so callers cannot smuggle a broader shape across this boundary.
     */
    resources: Record<string, number>;
    /**
     * keyed/nested reserved structure owned by {@link PlayerAiBlackboardData}. Keep its keys and value contract
     * explicit so callers cannot smuggle a broader shape across this boundary.
     */
    reserved: Record<string, number>;

    /**
     * Optional keyed/nested income instant structure owned by {@link PlayerAiBlackboardData}. Keep its keys and
     * value contract explicit so callers cannot smuggle a broader shape across this boundary.
     */
    incomeInstant?: Record<string, number>;
    /**
     * Optional keyed/nested income smoothed structure owned by {@link PlayerAiBlackboardData}. Keep its keys and
     * value contract explicit so callers cannot smuggle a broader shape across this boundary.
     */
    incomeSmoothed?: Record<string, number>;
    /**
     * Optional temporal value for {@link PlayerAiBlackboardData}. It anchors ordering, expiry, or presentation
     * timing and must use the time domain declared by the enclosing contract.
     */
    lastIncomeSampleAt?: number;
    /**
     * Optional keyed/nested last income snapshot structure owned by {@link PlayerAiBlackboardData}. Keep its keys
     * and value contract explicit so callers cannot smuggle a broader shape across this boundary.
     */
    lastIncomeSnapshot?: Record<string, number>;
  };

  // ---- Production ----
  /**
   * Optional collection value on {@link PlayerAiBlackboardData}. Its element type defines the records that may
   * cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  production?: {
    /**
     * keyed/nested supply structure owned by {@link PlayerAiBlackboardData}. Keep its keys and value contract
     * explicit so callers cannot smuggle a broader shape across this boundary.
     */
    supply: {
      /**
       * numeric used carried by {@link PlayerAiBlackboardData}. Its units and valid range are defined by {@link
       * PlayerAiBlackboardData} and must remain consistent across producers and consumers.
       */
      used: number;
      /**
       * numeric max carried by {@link PlayerAiBlackboardData}. Its units and valid range are defined by {@link
       * PlayerAiBlackboardData} and must remain consistent across producers and consumers.
       */
      max: number;
      /**
       * numeric pending from queued carried by {@link PlayerAiBlackboardData}. Its units and valid range are defined
       * by {@link PlayerAiBlackboardData} and must remain consistent across producers and consumers.
       */
      pendingFromQueued: number;
    };

    // NEW
    /**
     * Optional collection value on {@link PlayerAiBlackboardData}. Its element type defines the records that may
     * cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
     */
    plannedStructures?: Array<{
      id: string;
      name: ObjectNames;
      reservedAt: number;
      cost: Partial<Record<ResourceType, number>>;
    }>;

    /**
     * Optional collection value on {@link PlayerAiBlackboardData}. Its element type defines the records that may
     * cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
     */
    prereqQueue?: Array<{
      id: string;
      type: PrerequisiteType;
      preRequirement: PreRequirement;
      insertedAt: number;
    }>;
  };

  // ---- Army (numbers only, no GameObjects) ----
  /**
   * Optional keyed/nested army structure owned by {@link PlayerAiBlackboardData}. Keep its keys and value
   * contract explicit so callers cannot smuggle a broader shape across this boundary.
   */
  army?: {
    /**
     * numeric military strength carried by {@link PlayerAiBlackboardData}. Its units and valid range are defined
     * by {@link PlayerAiBlackboardData} and must remain consistent across producers and consumers.
     */
    militaryStrength: number;
    /**
     * numeric enemy military strength carried by {@link PlayerAiBlackboardData}. Its units and valid range are
     * defined by {@link PlayerAiBlackboardData} and must remain consistent across producers and consumers.
     */
    enemyMilitaryStrength: number;
    /**
     * keyed/nested enemy intel structure owned by {@link PlayerAiBlackboardData}. Keep its keys and value contract
     * explicit so callers cannot smuggle a broader shape across this boundary.
     */
    enemyIntel: Record<
      number,
      {
        strength: number;
        unitsInCombat: number;
        flankOpen: boolean;
      }
    >;
  };

  // ---- Intel ----
  /**
   * Optional collection value on {@link PlayerAiBlackboardData}. Its element type defines the records that may
   * cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  intel?: {
    /**
     * enemy flank open value carried by {@link PlayerAiBlackboardData}. Its declared type is the compatibility
     * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
     */
    enemyFlankOpen: boolean;
    /**
     * map fully explored value carried by {@link PlayerAiBlackboardData}. Its declared type is the compatibility
     * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
     */
    mapFullyExplored: boolean;
    /**
     * collection value on {@link PlayerAiBlackboardData}. Its element type defines the records that may cross this
     * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
     */
    enemyPowerTrend: Array<{
      at: number;
      own: number;
      enemy: number;
    }>;
    /**
     * temporal value for {@link PlayerAiBlackboardData}. It anchors ordering, expiry, or presentation timing and
     * must use the time domain declared by the enclosing contract.
     */
    lastScoutedAt: number;
  };

  // ---- Map / planning ----
  /**
   * Optional collection value on {@link PlayerAiBlackboardData}. Its element type defines the records that may
   * cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  map?: {
    /**
     * base center tile value carried by {@link PlayerAiBlackboardData}. Its declared type is the compatibility
     * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
     */
    baseCenterTile: Vector3Simple | null;
    /**
     * collection value on {@link PlayerAiBlackboardData}. Its element type defines the records that may cross this
     * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
     */
    suggestedBuildTiles: Array<{ x: number; y: number }>;
  };

  // ---- Strategy slice ----
  /**
   * Optional keyed/nested strategy structure owned by {@link PlayerAiBlackboardData}. Keep its keys and value
   * contract explicit so callers cannot smuggle a broader shape across this boundary.
   */
  strategy?: {
    /**
     * string current carried by {@link PlayerAiBlackboardData}. Treat it according to the owning contract’s
     * validation and presentation rules rather than assuming it is a stable identifier.
     */
    current: string;
    /**
     * numeric bound or quantity carried by {@link PlayerAiBlackboardData}. Interpret it in the owning contract’s
     * units and preserve its validation constraints at boundaries.
     */
    baseSize: number;
    /**
     * numeric mode locked until carried by {@link PlayerAiBlackboardData}. Its units and valid range are defined
     * by {@link PlayerAiBlackboardData} and must remain consistent across producers and consumers.
     */
    modeLockedUntil: number;
  };

  // ---- Combat metadata ----
  /**
   * Optional temporal value for {@link PlayerAiBlackboardData}. It anchors ordering, expiry, or presentation
   * timing and must use the time domain declared by the enclosing contract.
   */
  combat?: {
    /**
     * collection value on {@link PlayerAiBlackboardData}. Its element type defines the records that may cross this
     * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
     */
    engagements: Array<{
      id: string;
      startedAt: number;
      ourUnits: number;
      enemyUnits: number;
    }>;
    /**
     * temporal value for {@link PlayerAiBlackboardData}. It anchors ordering, expiry, or presentation timing and
     * must use the time domain declared by the enclosing contract.
     */
    lastEngagementAt: number;
  };

  // ---- Cooldowns ----
  /**
   * Optional keyed/nested cooldowns structure owned by {@link PlayerAiBlackboardData}. Keep its keys and value
   * contract explicit so callers cannot smuggle a broader shape across this boundary.
   */
  cooldowns?: Record<string, number>;
}

// AI behavior tree state data for save/load
/**
 * Defines the structured aibehavior tree state data contract for this module. Its declared surface makes
 * blackboard, telemetry, enabled explicit to every consumer. Use this shared shape rather than an ad-hoc
 * object so adapters, persistence, and callers remain compatible.
 */
export interface AIBehaviorTreeStateData {
  /**
   * blackboard value carried by {@link AIBehaviorTreeStateData}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  blackboard: PlayerAiBlackboardData;
  /**
   * Optional telemetry value carried by {@link AIBehaviorTreeStateData}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  telemetry?: unknown;
  /**
   * Optional boolean policy/value on {@link AIBehaviorTreeStateData} that explicitly controls whether the
   * associated behavior is active; do not infer it from unrelated state.
   */
  enabled?: boolean;
  /**
   * Bounded authoritative outcome frontier for the legacy-to-pure brain adapter.
   * This survives save/load so an uncertain command is reconciled before retry.
   */
  commandReconciliation?: AiCommandReconciliationStateData;
}

/** Serializable H3 authority state owned by one AI player controller. */
export interface AiCommandReconciliationStateData {
  readonly schemaVersion: 1;
  readonly authorityEpoch: number;
  readonly processedSequenceWatermark: number;
  readonly pendingCommandIds: readonly string[];
  /** Full unresolved records; never evicted with recent history or refreshed on load. */
  readonly pendingCommands?: readonly {
    readonly dispatched: GameCommandOutcome;
    readonly lastProgressTick: number;
    readonly applicationObserved: boolean;
    readonly terminalActorIds: readonly ActorId[];
  }[];
  readonly recentOutcomes: readonly GameCommandOutcome[];
  readonly health: "healthy" | "reconciling" | "technical_fault";
}

/**
 * Defines the structured convertible component data contract for this module. Its declared surface makes
 * detection range, check interval explicit to every consumer. Use this shared shape rather than an ad-hoc
 * object so adapters, persistence, and callers remain compatible.
 */
export interface ConvertibleComponentData {
  /**
   * Optional numeric detection range carried by {@link ConvertibleComponentData}. Its units and valid range are
   * defined by {@link ConvertibleComponentData} and must remain consistent across producers and consumers.
   */
  detectionRange?: number;
  /**
   * Optional numeric check interval carried by {@link ConvertibleComponentData}. Its units and valid range are
   * defined by {@link ConvertibleComponentData} and must remain consistent across producers and consumers.
   */
  checkInterval?: number;
  /** Accumulated simulation milliseconds toward the next proximity check. */
  accumulatedTime?: number;
  /** True after the canonical proximity winner has taken ownership. */
  converted?: boolean;
}

/**
 * Defines the structured status effect component data contract for this module. Its declared surface makes
 * active effects explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters,
 * persistence, and callers remain compatible.
 */
export interface StatusEffectComponentData {
  /**
   * Optional collection value on {@link StatusEffectComponentData}. Its element type defines the records that
   * may cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  activeEffects?: StatusEffectData[];
}

/**
 * Defines the structured spell component data contract for this module. Its declared surface makes cooldowns,
 * autocast enabled explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters,
 * persistence, and callers remain compatible.
 */
export interface SpellComponentData {
  /**
   * Optional keyed/nested cooldowns structure owned by {@link SpellComponentData}. Keep its keys and value
   * contract explicit so callers cannot smuggle a broader shape across this boundary.
   */
  cooldowns?: Record<string, number>; // spellType -> remaining cooldown
  /**
   * Optional keyed/nested autocast enabled structure owned by {@link SpellComponentData}. Keep its keys and
   * value contract explicit so callers cannot smuggle a broader shape across this boundary.
   */
  autocastEnabled?: Record<string, boolean>; // spellType -> enabled
  /** In-flight spell impacts applied by simulation tick, never tween completion. */
  pendingImpacts?: PendingSpellImpactData[];
}

/** Save-safe spell impact queued against the fixed simulation clock. */
export interface PendingSpellImpactData {
  readonly effectId: string;
  readonly commandId: string;
  readonly commitmentKey: string;
  readonly playerNumber: number;
  readonly authorityEpoch: number;
  readonly sequence: number;
  readonly intentId?: string;
  readonly casterIds: readonly ActorId[];
  readonly spellType: string;
  readonly targetObjectId?: ActorId;
  readonly targetTile: Vector3Simple;
  readonly dueTick: number;
}

/**
 * Defines the structured research queue item data contract for this module. Its declared surface makes type,
 * remaining time explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters,
 * persistence, and callers remain compatible.
 */
export interface ResearchQueueItemData {
  /**
   * discriminator for {@link ResearchQueueItemData}. It selects the valid branch and behavior, so producers and
   * consumers must keep it synchronized with the accompanying fields.
   */
  type: ResearchType;
  /**
   * temporal value for {@link ResearchQueueItemData}. It anchors ordering, expiry, or presentation timing and
   * must use the time domain declared by the enclosing contract.
   */
  remainingTime: number; // ms remaining for this specific item
}

/**
 * Defines the structured research component data contract for this module. Its declared surface makes
 * researches explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters,
 * persistence, and callers remain compatible.
 */
export interface ResearchComponentData {
  /**
   * Optional collection value on {@link ResearchComponentData}. Its element type defines the records that may
   * cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  researches?: ResearchQueueItemData[]; // Array of items with per-item progress
}

/**
 * Defines the structured level component data contract for this module. Its declared surface makes level, max
 * level explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters,
 * persistence, and callers remain compatible.
 */
export interface LevelComponentData {
  /**
   * Optional numeric level carried by {@link LevelComponentData}. Its units and valid range are defined by
   * {@link LevelComponentData} and must remain consistent across producers and consumers.
   */
  level?: number;
  /**
   * Optional numeric max level carried by {@link LevelComponentData}. Its units and valid range are defined by
   * {@link LevelComponentData} and must remain consistent across producers and consumers.
   */
  maxLevel?: number;
}
