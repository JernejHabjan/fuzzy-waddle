import type { ActorId, PlayerNumber, Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { FactionType, ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiAccessNodeId, AiEvidenceId, AiKnownValueV1, AiSimulationTick } from "./ai-core-types";
import type { AiAccessGraphV1 } from "./ai-access-graph-v1";

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
  readonly resourceState: AiKnownValueV1<AiObservedResourceStateV1>;
  readonly activeEffectIds: readonly string[];
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
  readonly threatSummary: AiObservedThreatSummaryV1;
  /** Stage 4 map projection; absent only for pre-Stage-4 save compatibility. */
  readonly map?: AiObservedMapV1;
}
