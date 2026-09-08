import type { ActorId, PlayerNumber, Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { FactionType, ObjectNames, ResearchType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiAccessNodeId, AiEvidenceId, AiKnownValueV1, AiSimulationTick } from "./ai-core-types";
import type { AiAccessGraphV1 } from "./ai-access-graph-v1";
import type { SpellType } from "../../../entity/components/combat/spell-type";

/** Relationship visible to the observing player; neutral is not treated as hostile. */
export type AiDiplomacyRelationV1 = "self" | "ally" | "neutral" | "enemy";

/** Movement and targeting domains projected from effective runtime definitions. */
export type AiDomainV1 = "ground" | "water" | "air";

/** Effective capability values at the actor's observed level. */
export interface AiObservedCapabilityV1 {
  readonly id: string;
  readonly family: string;
  readonly level: number;
  readonly domains: readonly AiDomainV1[];
  readonly targetDomains: readonly AiDomainV1[];
  readonly capacity: AiKnownValueV1<number>;
}

/** Queue state visible to the AI without exposing private opponent production. */
export interface AiObservedQueueV1 {
  readonly capacity: number;
  readonly occupied: number;
  readonly itemIds: readonly string[];
}

/** Resource or growth state when the actor exposes that component. */
export interface AiObservedResourceStateV1 {
  readonly resourceType: ResourceType;
  readonly available: AiKnownValueV1<number>;
  readonly carried: AiKnownValueV1<number>;
  readonly growthReadyTick: AiKnownValueV1<AiSimulationTick>;
  readonly serviceCapacity: AiKnownValueV1<number>;
}

/** Owned cargo facts needed to reconcile physical boarding without inspecting live objects in the brain. */
export interface AiObservedContainerStateV1 {
  readonly capacity: number;
  readonly passengerIds: readonly ActorId[];
  readonly pendingPassengerIds: readonly ActorId[];
  /** Deposit containers have no movement domain and are never classified as troop transports. */
  readonly mobileDomains: readonly AiDomainV1[];
}

/** Runtime-consistent combat facts available to the owning player or a currently visible opponent. */
export interface AiObservedCombatProfileV1 {
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
    readonly targetDomains: readonly AiDomainV1[];
  }[];
  readonly healing: Readonly<{
    readonly amount: number;
    readonly cooldownTicks: number;
    readonly remainingCooldownTicks: number;
    readonly range: number;
  }> | null;
  readonly spells: readonly AiObservedSpellProfileV1[];
  readonly statuses: readonly {
    readonly type: string;
    readonly remainingTicks: number;
    readonly movementSpeedPermille: number;
  }[];
}

/** Legal spell data and live ownership flags needed by the pure support proposer. */
export interface AiObservedSpellProfileV1 {
  readonly spellType: SpellType;
  readonly ready: boolean;
  readonly researched: boolean;
  readonly autocast: boolean;
  readonly range: number;
  readonly areaRadius: number;
  readonly targetAllies: boolean;
  readonly targetEnemies: boolean;
  readonly targetSelf: boolean;
  readonly targetDomains: readonly AiDomainV1[];
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
export interface AiObservedActorV1 {
  readonly actorId: ActorId;
  readonly objectName: ObjectNames;
  readonly owner: PlayerNumber | null;
  readonly relation: AiDiplomacyRelationV1;
  readonly visibility: "owned" | "visible" | "last_seen";
  readonly evidenceId: AiEvidenceId;
  readonly observedTick: AiSimulationTick;
  readonly logicalPosition: AiKnownValueV1<Vector3Simple>;
  readonly accessNodeId: AiKnownValueV1<AiAccessNodeId>;
  readonly effectiveLevel: AiKnownValueV1<number>;
  readonly capabilities: readonly AiObservedCapabilityV1[];
  readonly queue: AiKnownValueV1<AiObservedQueueV1>;
  readonly cost: AiKnownValueV1<Readonly<Partial<Record<ResourceType, number>>>>;
  readonly housingCost: AiKnownValueV1<number>;
  readonly housingCapacity: AiKnownValueV1<number>;
  /** Owned/visible durability normalized to 0..1000; private opponents remain unknown. */
  readonly healthPermille?: AiKnownValueV1<number>;
  readonly resourceState: AiKnownValueV1<AiObservedResourceStateV1>;
  /** Owned construction percentage; absent only for legacy observations. */
  readonly constructionProgress?: AiKnownValueV1<number>;
  readonly activeEffectIds: readonly string[];
  /** Effective combat/support facts; remembered actors intentionally never retain live cooldown or health data. */
  readonly combatProfile?: AiKnownValueV1<AiObservedCombatProfileV1>;
  /** Runtime-definition metadata exposed for owned actors; base identity never infers this from position. */
  readonly mainBuilding?: AiKnownValueV1<boolean>;
  /** Stable container owner when this actor is physically loaded; absent on pre-Stage-8 observations. */
  readonly containedInActorId?: ActorId | null;
  /** Known only for owned containers; opponent cargo remains private. */
  readonly containerState?: AiKnownValueV1<AiObservedContainerStateV1>;
}

/** Permitted resource facts for the observing player. */
export interface AiObservedResourceLedgerV1 {
  readonly resourceType: ResourceType;
  readonly stockpile: number;
  readonly reservedUnspent: number;
  readonly obligationsDue: number;
  readonly deliveredIncomePerMinute: AiKnownValueV1<number>;
}

/** Bounded access result produced independently of the atomic actor snapshot. */
export interface AiObservedAccessProductV1 {
  readonly queryId: string;
  readonly revision: number;
  readonly status: "ready" | "not_ready" | "unknown" | "blocked" | "service_failed";
  readonly fromNodeId: AiAccessNodeId;
  readonly toNodeId: AiAccessNodeId;
  readonly domains: readonly AiDomainV1[];
  readonly updatedTick: AiSimulationTick;
}

/** A visible effect or zone; hidden effects never enter this boundary. */
export interface AiObservedEffectV1 {
  readonly effectId: string;
  readonly owner: PlayerNumber | null;
  readonly relation: AiDiplomacyRelationV1;
  readonly position: Vector3Simple;
  readonly targetDomains: readonly AiDomainV1[];
  readonly expiresAt: AiKnownValueV1<AiSimulationTick>;
  readonly radius?: number;
  readonly influence?: "harmful" | "beneficial" | "mixed";
}

/** Current game-mode objective as exposed by ordinary mode rules. */
export interface AiObservedModeGoalV1 {
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
export interface AiObservedResearchCandidateV1 {
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
export interface AiObservedMapV1 {
  readonly bounds: AiKnownValueV1<{ readonly width: number; readonly height: number }>;
  readonly staticRevision: number;
  readonly frontierAccessNodeIds: readonly AiAccessNodeId[];
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
  }[];
  /** Completed cached topology generation; optional for legacy observations and isolated fixtures. */
  readonly accessGraph?: AiAccessGraphV1;
}

/** Canonical permitted threat evidence, isolated from the mutable actor index. */
export interface AiObservedThreatSummaryV1 {
  readonly observedTick: AiSimulationTick;
  readonly visibleEnemyActorIds: readonly ActorId[];
  readonly rememberedEnemyActorIds: readonly ActorId[];
  readonly observedCapabilityFamilies: readonly string[];
}

/**
 * Immutable pure observation committed at one simulation tick. Arrays with set semantics are
 * canonicalized before the brain sees them; optional expensive access products may remain pending.
 */
export interface AiObservationV1 {
  readonly schemaVersion: 1;
  readonly generation: number;
  readonly tick: AiSimulationTick;
  readonly playerNumber: PlayerNumber;
  readonly faction: FactionType;
  readonly actors: readonly AiObservedActorV1[];
  readonly resources: readonly AiObservedResourceLedgerV1[];
  readonly accessProducts: readonly AiObservedAccessProductV1[];
  readonly effects: readonly AiObservedEffectV1[];
  readonly modeGoals: readonly AiObservedModeGoalV1[];
  readonly researchCandidates: readonly AiObservedResearchCandidateV1[];
  readonly threatSummary: AiObservedThreatSummaryV1;
  /** Stage 4 map projection; absent only for pre-Stage-4 save compatibility. */
  readonly map?: AiObservedMapV1;
}
