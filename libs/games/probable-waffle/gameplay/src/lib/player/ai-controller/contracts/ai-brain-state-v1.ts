import type { ActorId, PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import type { FactionType, ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type {
  AiBaseId,
  AiDeadlineV1,
  AiEvidenceId,
  AiFortificationPlanId,
  AiPlanId,
  AiQuestionId,
  AiSimulationTick,
  AiSquadId,
  AiSupportPlanId,
  AiTransportPlanId
} from "./ai-core-types";
import type { AiPlanV1, AiDemandV1 } from "./ai-plan-contracts";
import type { AiReservationV1, AiWaitEdgeV1 } from "./ai-dependency-contracts";
import type { AiAuthorityStateV1, AiCommandOutcomeV1 } from "./ai-command-contracts";
import type { AiBlockerV1, AiProgressContractV1, AiRecoveryEpisodeV1 } from "./ai-progress-contracts";
import type { AiLaneServiceStateV1 } from "./ai-lane-contracts";
import type { AiQueryStateV1 } from "./ai-query-contracts";
import type { AiRouteRequestV1, AiRouteResultV1 } from "./ai-access-graph-v1";

/** Persisted strategic stance with commitment hysteresis. */
export interface AiStrategyStateV1 {
  readonly stance: "opening" | "stabilize" | "defend" | "pressure" | "expand" | "recover" | "finish";
  readonly enteredTick: AiSimulationTick;
  readonly goalId: AiPlanId | null;
  readonly objectiveId: string | null;
  readonly commitmentDeadline: AiDeadlineV1;
  readonly evidenceIds: readonly AiEvidenceId[];
  readonly suspendedGoalId: AiPlanId | null;
}

/** Opening state is separate so completed checkpoints survive defense and migration. */
export interface AiOpeningStateV1 {
  readonly archetypeId: string;
  readonly archetypeVersion: string;
  readonly selectedAtTick: AiSimulationTick;
  readonly plan: AiPlanV1;
}

/** Permitted durable knowledge with stable evidence/question identities. */
export interface AiKnowledgeStateV1 {
  readonly revision: number;
  readonly evidence: readonly {
    readonly evidenceId: AiEvidenceId;
    readonly sourceId: string;
    readonly observedTick: AiSimulationTick;
    readonly confidencePermille: number;
  }[];
  readonly questions: readonly {
    readonly questionId: AiQuestionId;
    readonly kind: string;
    readonly createdTick: AiSimulationTick;
    readonly state: "open" | "answered" | "obsolete" | "too_costly";
  }[];
}

/** Base identity and assigned assets; geometry stays in bounded observation/query products. */
export interface AiBaseStateV1 {
  readonly baseId: AiBaseId;
  readonly anchorActorId: ActorId | null;
  readonly memberActorIds: readonly ActorId[];
  readonly active: boolean;
  /** Main structures retain identity; proposed expansion sites have no live anchor until construction applies. */
  readonly lifecycle?: "proposed" | "reserved" | "establishing" | "active" | "evacuating" | "lost";
  readonly accessNodeId?: string | null;
  readonly anchorPosition?: { readonly x: number; readonly y: number; readonly z: number } | null;
  readonly reservedSiteKey?: string | null;
  readonly rejectedSiteKeys?: readonly { readonly siteKey: string; readonly retryAfterTick: AiSimulationTick; readonly reason: string }[];
  readonly expansion?: Readonly<{
    readonly trigger: "resource_life" | "worker_capacity" | "manual";
    readonly requestedAtTick: AiSimulationTick;
    readonly transportPlanId: AiTransportPlanId | null;
    readonly evacuationRouteNodeId: string | null;
  }>;
}

/** Resource forecasts and production demands kept outside a global blackboard. */
export interface AiEconomyProductionStateV1 {
  readonly demands: readonly AiDemandV1[];
  readonly forecasts: readonly {
    readonly resourceType: ResourceType;
    readonly horizonTick: AiSimulationTick;
    readonly amount: number;
    readonly confidencePermille: number;
  }[];
}

/** Stage-12 causal recovery facts. Entries are bounded, save-safe and never contain live runtime handles. */
export interface AiRecoveryStateV1 {
  readonly records: readonly {
    readonly recoveryKey: string;
    readonly domain: "economy" | "placement" | "blocker" | "repair" | "transport" | "fortification" | "squad";
    readonly planId: AiPlanId | null;
    readonly actorId: ActorId | null;
    readonly cause: string;
    readonly enteredTick: AiSimulationTick;
    readonly lastProgressTick: AiSimulationTick;
    readonly nextRetryTick: AiSimulationTick;
    readonly phaseDeadline: AiDeadlineV1;
    readonly attempt: number;
    readonly state: "watching" | "backoff" | "recovering" | "abandoned" | "technical_fault";
    readonly alternate: string | null;
    readonly releasedClaimIds: readonly string[];
  }[];
}

/** Squad membership and objective ownership. */
export interface AiSquadStateV1 {
  readonly squadId: AiSquadId;
  /** Persistent duty; Stage 9 never reassigns the whole army because one contact is nearer. */
  readonly role: "defense" | "attack" | "reserve" | "reinforcement" | "scout" | "escort";
  readonly domain: "ground" | "water" | "air" | "mixed";
  readonly actorIds: readonly ActorId[];
  readonly objectiveId: string | null;
  readonly state: "forming" | "assemble" | "rally" | "ready" | "advance" | "moving" | "engage" | "engaged" | "defend" | "regroup" | "retreat" | "retreating" | "recover" | "recovering" | "reserve" | "searching" | "completed" | "cancelled";
  /** Mission-owned deadline and last independently observed useful effect. */
  readonly lifecycle?: Readonly<{
    readonly targetPlayerNumber: PlayerNumber | null;
    readonly targetRegionId: string | null;
    readonly protectedBaseId: AiBaseId | null;
    readonly rallyNodeId: string | null;
    readonly retreatNodeId: string | null;
    readonly createdTick: AiSimulationTick;
    readonly assemblyDeadline: AiDeadlineV1;
    readonly effectDeadline: AiDeadlineV1;
    readonly lastUsefulEffectTick: AiSimulationTick | null;
    readonly recoveryAttempt: number;
    readonly terminalReason: string | null;
  }>;
  /** Stage-13 tactical commitment; saved fields prevent target thrash and retreat/relaunch loops. */
  readonly tactics?: Readonly<{
    readonly taskForceId: string;
    readonly script: "hold_front" | "advance_focus" | "ranged_distance" | "spread_against_area" | "protected_retreat" | "intercept_air_transport" | "naval_control" | "escort" | "land_regroup" | "rampart_defend" | "rampart_reinforce" | "rampart_withdraw";
    readonly targetActorId: ActorId | null;
    readonly targetScore: number;
    readonly engagementRatioPermille: number;
    readonly confidencePermille: number;
    readonly predictedFriendlyLossPermille: number;
    readonly predictedEnemyLossPermille: number;
    readonly lastObservedMemberCount: number;
    readonly observedLossCount: number;
    readonly lastTransitionTick: AiSimulationTick;
    readonly nextReconsiderTick: AiSimulationTick;
    readonly oscillationCount: number;
    readonly orderSignature: string | null;
    /** Actors already covered by the current order signature; large squads continue across quota-limited steps. */
    readonly orderedActorIds: readonly ActorId[];
    readonly assignedPositions: readonly { readonly actorId: ActorId; readonly position: { readonly x: number; readonly y: number; readonly z: number } }[];
    readonly damageReservations: readonly { readonly actorId: ActorId; readonly targetActorId: ActorId; readonly expectedDamage: number; readonly impactTick: AiSimulationTick; readonly effectId?: string }[];
    readonly protectedRouteNodeIds: readonly string[];
    readonly mobileReserveActorIds: readonly ActorId[];
    readonly objectiveAlternatives: readonly { readonly objectiveId: string; readonly score: number; readonly reason: string }[];
  }>;
}

/** A bounded, player-fair incident built only from permitted hostile evidence. */
export interface AiThreatIncidentV1 {
  readonly incidentId: string;
  readonly baseId: AiBaseId | null;
  readonly regionId: string | null;
  readonly hostileActorIds: readonly ActorId[];
  readonly kind: "worker_harassment" | "army_pressure" | "flyer" | "naval" | "transport_landing" | "proxy_blocker" | "unknown";
  readonly confidencePermille: number;
  readonly severity: number;
  readonly createdTick: AiSimulationTick;
  readonly expiresAt: AiDeadlineV1;
}

/** Mode evaluation is saved so a reload cannot forget a chronic loss or duplicate concession. */
export interface AiModeStateV1 {
  readonly state: "active" | "winning" | "hopeless" | "conceding" | "conceded" | "finished";
  readonly hopelessSinceTick: AiSimulationTick | null;
  readonly concessionIntentId: string | null;
  readonly lastReason: string | null;
}

/** Stage-9 strategic state: questions, incidents and mission facts without live-world handles. */
export interface AiSkirmishStateV1 {
  readonly incidents: readonly AiThreatIncidentV1[];
  readonly mode: AiModeStateV1;
  /** Bounded causal event ledger used by the read-only debug timeline. */
  readonly timeline: readonly {
    readonly eventId: string;
    readonly tick: AiSimulationTick;
    readonly kind: "question" | "threat" | "mission" | "effect" | "mode";
    readonly subjectId: string;
    readonly detail: string;
  }[];
}

/** Persisted transport phase without live actor references or promises. */
export interface AiTransportStateV1 {
  readonly planId: AiTransportPlanId;
  readonly phase:
    | "prepare"
    | "board"
    | "travel"
    | "unload"
    | "return"
    | "proposed"
    | "reserving"
    | "gather"
    | "rendezvous"
    | "boarding"
    | "transit"
    | "landing"
    | "unloading"
    | "regroup"
    | "handoff"
    | "recovering"
    | "cancelled"
    | "completed"
    | "failed";
  readonly passengerIds: readonly ActorId[];
  readonly transportIds: readonly ActorId[];
  readonly queryIds: readonly string[];
  /** Extended Stage-8 lifecycle is optional only for migration of earlier empty/preparatory V1 saves. */
  readonly lifecycle?: Readonly<{
    readonly missionKind: "island_establishment" | "army_transfer" | "evacuation";
    readonly route: AiRouteResultV1;
    readonly routeRequest: AiRouteRequestV1;
    readonly routeGeneration: number;
    readonly manifest: readonly {
      readonly actorId: ActorId;
      readonly role: "builder" | "protection" | "worker" | "combat" | "support";
      readonly seats: number;
      readonly indispensable: boolean;
      readonly handoff: "economy" | "squad" | "support";
    }[];
    readonly assignedTransportIds: readonly ActorId[];
    readonly seatAssignments: readonly { readonly transportId: ActorId; readonly passengerIds: readonly ActorId[] }[];
    readonly escortIds: readonly ActorId[];
    readonly assignedCapacity: number;
    readonly requiredCapacity: number;
    readonly departureCapacityPermille: number;
    readonly pickupTransferId: string | null;
    readonly landingTransferId: string | null;
    readonly phaseDeadline: AiDeadlineV1;
    readonly estimatedTravelTicks: number;
    readonly recoveryAttempt: number;
    readonly maxRecoveryAttempts: number;
    readonly lastProgressTick: AiSimulationTick;
    readonly pendingIntentIds: readonly string[];
    readonly capacityDemand: AiDemandV1 | null;
    readonly terminalReason: string | null;
  }>;
}

/** Persisted wall/tower graph identity and bounded construction state. */
export interface AiFortificationStateV1 {
  readonly planId: AiFortificationPlanId;
  readonly nodeIds: readonly string[];
  readonly completedNodeIds: readonly string[];
  readonly protectedBaseIds: readonly AiBaseId[];
  readonly lifecycle: "planned" | "building" | "active" | "breached" | "abandoned";
  /** Optional for migration; Stage 11 owns this executable, bounded graph description. */
  readonly graph?: Readonly<{
    readonly baseId: AiBaseId;
    readonly createdTick: AiSimulationTick;
    readonly terrainAnchorTileKeys: readonly string[];
    readonly openingNodeId: string;
    readonly protectedAssetIds: readonly ActorId[];
    readonly wholeConnectivity: "preserved" | "rejected" | "unknown";
    readonly incrementalConnectivity: "preserved" | "rejected" | "unknown";
    readonly budget: Readonly<{
      readonly spendPermille: number;
      readonly committedByResource: Readonly<Partial<Record<ResourceType, number>>>;
      readonly remainingByResource: Readonly<Partial<Record<ResourceType, number>>>;
    }>;
    readonly nodes: readonly AiFortificationNodeStateV1[];
    /** Stable topological build order; unlike keyed node sets this sequence is not sorted during save. */
    readonly constructionSequenceNodeIds: readonly string[];
    readonly defenderPosts: readonly {
      readonly nodeId: string;
      readonly assignedActorIds: readonly ActorId[];
      readonly reachable: boolean;
    }[];
    readonly breach: Readonly<{
      readonly missingNodeIds: readonly string[];
      readonly reason: string | null;
      readonly risk: "none" | "low" | "medium" | "high";
      readonly responseEffectId: string | null;
      readonly recoveryAttempts: number;
    }>;
  }>;
}

/** Stable constructible or reserved-opening node within one fortification graph. */
export interface AiFortificationNodeStateV1 {
  readonly nodeId: string;
  readonly kind: "wall" | "tower" | "stair" | "gate_slot";
  readonly objectName: ObjectNames | null;
  readonly position: { readonly x: number; readonly y: number; readonly z: number };
  readonly footprintTileKeys: readonly string[];
  readonly navigation: Readonly<{
    readonly navigableHeight: number | null;
    readonly enterHeight: number | null;
    readonly exitHeight: number | null;
  }> | null;
  readonly componentId: string;
  readonly dependsOnNodeId: string | null;
  readonly lifecycle: "planned" | "requested" | "finished" | "destroyed" | "abandoned";
  readonly completedActorId: ActorId | null;
  readonly attempt: number;
  readonly effectId: string | null;
  readonly retryAfterTick: AiSimulationTick;
  readonly marginalCoverage: number;
  readonly targetDomains: readonly ("ground" | "water" | "air")[];
  readonly defenderPostReachable: boolean;
}

/** Persisted support assignment and temporary-effect ownership. */
export interface AiSupportStateV1 {
  readonly planId: AiSupportPlanId;
  readonly actorIds: readonly ActorId[];
  readonly targetIds: readonly ActorId[];
  readonly expiresAt: AiDeadlineV1 | null;
  readonly kind?: "heal" | "spell" | "temporary_support";
  readonly spellType?: string | null;
  readonly state?: "reserved" | "dispatched" | "active" | "completed" | "released";
  readonly effectId?: string | null;
  readonly usefulCapacity?: number;
  readonly reason?: string;
}

/** Scheduler cursors and RNG state are saved so pauses/reloads do not change choices. */
export interface AiSchedulerStateV1 {
  readonly decisionSequence: number;
  readonly accumulatorTicks: number;
  readonly catchUpLimit: 2;
  readonly continuationCursors: readonly { readonly owner: string; readonly cursor: number }[];
  readonly rngState: readonly number[];
}

/** Monotonic counters allocate stable IDs independently of wall time. */
export interface AiIdentityCountersV1 {
  readonly nextPlan: number;
  readonly nextStep: number;
  readonly nextDemand: number;
  readonly nextClaim: number;
  readonly nextIntent: number;
  readonly nextEffect: number;
  readonly nextCommand: number;
  readonly nextEvidence: number;
  readonly nextQuestion: number;
}

/**
 * Versioned pure brain state. Each named slice has one future reducer owner; the legacy
 * blackboard may feed migration input but never owns or mutates this structure.
 */
export interface AiBrainStateV1 {
  readonly schemaVersion: 1;
  readonly playerNumber: PlayerNumber;
  readonly faction: FactionType;
  readonly profileVersion: string;
  /** Lobby-resolved fair difficulty persisted with the brain for replay and host-transfer provenance. */
  readonly profileDifficulty?: "easy" | "normal" | "hard";
  readonly lastCommittedTick: AiSimulationTick;
  readonly strategy: AiStrategyStateV1;
  readonly opening: AiOpeningStateV1;
  readonly knowledge: AiKnowledgeStateV1;
  readonly skirmish: AiSkirmishStateV1;
  readonly bases: readonly AiBaseStateV1[];
  readonly economyProduction: AiEconomyProductionStateV1;
  readonly recovery: AiRecoveryStateV1;
  readonly reservations: readonly AiReservationV1[];
  readonly waitEdges: readonly AiWaitEdgeV1[];
  readonly pendingOutcomes: readonly AiCommandOutcomeV1[];
  readonly authority: AiAuthorityStateV1;
  readonly squads: readonly AiSquadStateV1[];
  readonly transport: readonly AiTransportStateV1[];
  readonly fortifications: readonly AiFortificationStateV1[];
  readonly support: readonly AiSupportStateV1[];
  readonly progress: readonly AiProgressContractV1[];
  readonly blockers: readonly AiBlockerV1[];
  readonly recoveryEpisodes: readonly AiRecoveryEpisodeV1[];
  readonly lanes: readonly AiLaneServiceStateV1[];
  readonly queries: readonly AiQueryStateV1[];
  readonly scheduler: AiSchedulerStateV1;
  readonly identities: AiIdentityCountersV1;
}
