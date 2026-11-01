import type { ActorId, PlayerNumber, Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type {
  FactionType,
  ObjectNames,
  OrderType,
  ResearchType,
  ResourceType
} from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiAccessNodeId, AiEvidenceId, AiKnownValue, AiSimulationTick } from "./ai-core-types";
import type { AiAccessGraph } from "./ai-access-graph";
import type { SpellType } from "../../../entity/components/combat/spell-type";

/** Relationship visible to the observing player; neutral is not treated as hostile. */
export type AiDiplomacyRelation = "self" | "ally" | "neutral" | "enemy";

/** Movement and targeting domains projected from effective runtime definitions. */
export type AiDomain = "ground" | "water" | "air";

/** Effective capability values at the actor's observed level. */
export interface AiObservedCapability {
  readonly id: string;
  readonly family: string;
  readonly level: number;
  readonly domains: readonly AiDomain[];
  readonly targetDomains: readonly AiDomain[];
  readonly capacity: AiKnownValue<number>;
}

/** Queue state visible to the AI without exposing private opponent production. */
export interface AiObservedQueue {
  readonly capacity: number;
  readonly occupied: number;
  readonly itemIds: readonly string[];
  /** Typed owned queue contents. Optional only for captures made before Stage 15. */
  readonly items?: readonly {
    readonly itemId: string;
    readonly kind: "production" | "research";
    readonly objectName: ObjectNames | null;
    readonly researchType: ResearchType | null;
    /** Shared applied effect identity, owned queues only; absent for legacy unstamped work. */
    readonly effectId?: string;
  }[];
}

/** Resource or growth state when the actor exposes that component. */
export interface AiObservedResourceState {
  readonly resourceType: ResourceType;
  readonly available: AiKnownValue<number>;
  readonly carried: AiKnownValue<number>;
  readonly growthReadyTick: AiKnownValue<AiSimulationTick>;
  readonly serviceCapacity: AiKnownValue<number>;
}

/** Current owned pawn order; opponent and remembered orders are never exposed. */
export interface AiObservedOrder {
  readonly orderType: OrderType;
  readonly targetActorId: ActorId | null;
  /** Native tile destination for owned move orders when the pawn order provides one. */
  readonly targetPosition?: Vector3Simple | null;
}

/** Owned cargo facts needed to reconcile physical boarding without inspecting live objects in the brain. */
export interface AiObservedContainerState {
  readonly capacity: number;
  readonly passengerIds: readonly ActorId[];
  readonly pendingPassengerIds: readonly ActorId[];
  /** Deposit containers have no movement domain and are never classified as troop transports. */
  readonly mobileDomains: readonly AiDomain[];
}

/** Runtime-consistent combat facts available to the owning player or a currently visible opponent. */
export interface AiObservedCombatProfile {
  readonly maxHealth: number;
  readonly maxArmour: number;
  readonly armourPermille: number;
  readonly passiveRegenerationPerSecond: number;
  readonly attacks: readonly {
    readonly damage: number;
    readonly cooldownTicks: number;
    /** Owned current cooldown; null for opponents and absent in older captures. */
    readonly remainingCooldownTicks?: number | null;
    readonly range: number;
    readonly minRange: number;
    readonly highGroundRangeBonus: number;
    readonly impactDelayTicks: number;
    readonly areaRadius: number;
    readonly targetDomains: readonly AiDomain[];
  }[];
  readonly healing: Readonly<{
    readonly amount: number;
    readonly cooldownTicks: number;
    readonly remainingCooldownTicks: number;
    readonly range: number;
  }> | null;
  readonly spells: readonly AiObservedSpellProfile[];
  readonly statuses: readonly {
    readonly type: string;
    readonly remainingTicks: number;
    readonly movementSpeedPermille: number;
  }[];
}

/** Legal spell data and live ownership flags needed by the pure support proposer. */
export interface AiObservedSpellProfile {
  readonly spellType: SpellType;
  readonly ready: boolean;
  readonly researched: boolean;
  readonly autocast: boolean;
  readonly range: number;
  readonly areaRadius: number;
  readonly targetAllies: boolean;
  readonly targetEnemies: boolean;
  readonly targetSelf: boolean;
  readonly targetDomains: readonly AiDomain[];
  readonly instantDamage: number;
  readonly periodicDamage: number;
  readonly instantHeal: number;
  readonly periodicHeal: number;
  readonly stunTicks: number;
  readonly slowTicks: number;
  readonly zoneDurationTicks: number;
  readonly summons: boolean;
  readonly summonDurationTicks: number | null;
}

/** One visible or remembered actor in an immutable observation generation. */
export interface AiObservedActor {
  readonly actorId: ActorId;
  readonly objectName: ObjectNames;
  readonly owner: PlayerNumber | null;
  readonly relation: AiDiplomacyRelation;
  readonly visibility: "owned" | "visible" | "last_seen";
  /** Historical combatant classification retained only after an enemy was observed; contains no combat statistics. */
  readonly wasCombatant?: boolean;
  /** Current enemy contacts visible to this owned actor's native vision source. */
  readonly visibleEnemyActorIds?: readonly ActorId[];
  readonly evidenceId: AiEvidenceId;
  readonly observedTick: AiSimulationTick;
  readonly logicalPosition: AiKnownValue<Vector3Simple>;
  readonly accessNodeId: AiKnownValue<AiAccessNodeId>;
  readonly effectiveLevel: AiKnownValue<number>;
  readonly capabilities: readonly AiObservedCapability[];
  readonly queue: AiKnownValue<AiObservedQueue>;
  readonly cost: AiKnownValue<Readonly<Partial<Record<ResourceType, number>>>>;
  readonly housingCost: AiKnownValue<number>;
  readonly housingCapacity: AiKnownValue<number>;
  /** Owned/visible durability normalized to 0..1000; private opponents remain unknown. */
  readonly healthPermille?: AiKnownValue<number>;
  readonly resourceState: AiKnownValue<AiObservedResourceState>;
  /** Owned native extraction/drop-off is awaiting completion; even an empty pack is not available labor. */
  readonly resourceTransferInFlight?: boolean;
  /** Exact owned carrier amount, including a known empty pack whose resource type has already been cleared. */
  readonly carriedResourceAmount?: number;
  /** Owned construction percentage; absent only for legacy observations. */
  readonly constructionProgress?: AiKnownValue<number>;
  readonly activeEffectIds: readonly string[];
  /** Optional only for compatibility with observations captured before Stage 15. */
  readonly activeOrder?: AiKnownValue<AiObservedOrder | null>;
  /** Next owned native order, including intake queued before the pawn starts executing it. */
  readonly pendingOrder?: AiKnownValue<AiObservedOrder | null>;
  /** Effective combat/support facts; remembered actors intentionally never retain live cooldown or health data. */
  readonly combatProfile?: AiKnownValue<AiObservedCombatProfile>;
  /** Runtime-definition metadata exposed for owned actors; base identity never infers this from position. */
  readonly mainBuilding?: AiKnownValue<boolean>;
  /** Stable container owner when this actor is physically loaded; absent on pre-Stage-8 observations. */
  readonly containedInActorId?: ActorId | null;
  /** Known only for owned containers; opponent cargo remains private. */
  readonly containerState?: AiKnownValue<AiObservedContainerState>;
}

/** Permitted resource facts for the observing player. */
export interface AiObservedResourceLedger {
  readonly resourceType: ResourceType;
  readonly stockpile: number;
  readonly reservedUnspent: number;
  readonly obligationsDue: number;
  readonly deliveredIncomePerMinute: AiKnownValue<number>;
}

/** Bounded access result produced independently of the atomic actor snapshot. */
export interface AiObservedAccessProduct {
  readonly queryId: string;
  readonly revision: number;
  readonly status: "ready" | "not_ready" | "unknown" | "blocked" | "service_failed";
  readonly fromNodeId: AiAccessNodeId;
  readonly toNodeId: AiAccessNodeId;
  readonly domains: readonly AiDomain[];
  readonly updatedTick: AiSimulationTick;
}

/** A visible effect or zone; hidden effects never enter this boundary. */
export interface AiObservedEffect {
  readonly effectId: string;
  readonly owner: PlayerNumber | null;
  readonly relation: AiDiplomacyRelation;
  readonly position: Vector3Simple;
  readonly targetDomains: readonly AiDomain[];
  readonly expiresAt: AiKnownValue<AiSimulationTick>;
  readonly radius?: number;
  readonly influence?: "harmful" | "beneficial" | "mixed";
}

/** Current game-mode objective as exposed by ordinary mode rules. */
export interface AiObservedModeGoal {
  readonly id: string;
  readonly kind: "destroy" | "protect" | "control" | "score" | "survive";
  readonly owner: PlayerNumber | null;
  readonly targetActorIds: readonly ActorId[];
  readonly targetAccessNodeIds: readonly AiAccessNodeId[];
  readonly state: "active" | "completed" | "failed" | "unknown";
}

/**
 * A research command legal for the owning player at this observation boundary.
 * It is derived by the runtime adapter, so the pure brain never reads a live tech tree.
 */
export interface AiObservedResearchCandidate {
  readonly producerId: ActorId;
  readonly researchType: ResearchType;
  readonly cost: Readonly<Partial<Record<ResourceType, number>>>;
  readonly durationTicks: number;
  readonly refundPermille: number;
  readonly benefit: Readonly<{
    readonly kind: "unit_level" | "spell";
    readonly targetObjectName: ObjectNames | null;
    readonly targetLevel: number | null;
    readonly spellType: SpellType | null;
  }>;
}

/**
 * Player-permitted map inputs. Dynamic obstacles only appear after the observing
 * player could see them; expensive region work stays separately statused.
 */
export interface AiObservedMap {
  readonly bounds: AiKnownValue<{ readonly width: number; readonly height: number }>;
  readonly staticRevision: number;
  readonly frontierAccessNodeIds: readonly AiAccessNodeId[];
  /** Bounded static-ground search samples. Information coverage is finer than route-connected regions. */
  readonly scoutSearchPoints?: readonly {
    readonly pointId: string;
    readonly accessNodeId: AiAccessNodeId;
    readonly position: Vector3Simple;
    readonly observed: boolean;
  }[];
  /** Centers of owned vision sources; evidence rather than hidden fog state. */
  readonly scoutCoverageAccessNodeIds: readonly AiAccessNodeId[];
  readonly dynamicObstacleActorIds: readonly ActorId[];
  readonly regionGeneration: {
    readonly generation: number;
    readonly status: "ready" | "not_ready" | "unknown" | "blocked" | "service_failed";
    readonly continuationCursor: number;
  };
  /** Bounded player-permitted local cells used for hypothetical construction connectivity. */
  readonly constructionCells?: readonly {
    readonly tileKey: string;
    readonly position: Vector3Simple;
    readonly groundPassable: boolean;
    readonly waterPassable: boolean;
    readonly elevation: number;
    readonly observedBlocked: boolean;
    /** Visible stationary blockers used when checking whether construction preserves ground access. */
    readonly staticBlocked?: boolean;
    readonly groundAccessNodeId?: AiAccessNodeId;
  }[];
  readonly tacticalCells?: readonly {
    readonly tileKey: string;
    readonly position: Vector3Simple;
    readonly groundPassable: boolean;
    readonly waterPassable: boolean;
    readonly elevation: number;
    readonly observedBlocked: boolean;
    /** Known region lookup for route-checking ground assault approach cells. */
    readonly groundAccessNodeId?: AiAccessNodeId;
  }[];
  /** Completed cached topology generation; optional for legacy observations and isolated fixtures. */
  readonly accessGraph?: AiAccessGraph;
}

/** Canonical permitted threat evidence, isolated from the mutable actor index. */
export interface AiObservedThreatSummary {
  readonly observedTick: AiSimulationTick;
  readonly visibleEnemyActorIds: readonly ActorId[];
  readonly rememberedEnemyActorIds: readonly ActorId[];
  readonly observedCapabilityFamilies: readonly string[];
}

/**
 * Immutable pure observation committed at one simulation tick. Arrays with set semantics are
 * canonicalized before the brain sees them; optional expensive access products may remain pending.
 */
export interface AiObservation {
  readonly schemaVersion: 1;
  readonly generation: number;
  readonly tick: AiSimulationTick;
  readonly playerNumber: PlayerNumber;
  readonly faction: FactionType;
  readonly actors: readonly AiObservedActor[];
  readonly resources: readonly AiObservedResourceLedger[];
  readonly accessProducts: readonly AiObservedAccessProduct[];
  readonly effects: readonly AiObservedEffect[];
  readonly modeGoals: readonly AiObservedModeGoal[];
  readonly researchCandidates: readonly AiObservedResearchCandidate[];
  readonly threatSummary: AiObservedThreatSummary;
  /** Stage 4 map projection; absent only for pre-Stage-4 save compatibility. */
  readonly map?: AiObservedMap;
}
