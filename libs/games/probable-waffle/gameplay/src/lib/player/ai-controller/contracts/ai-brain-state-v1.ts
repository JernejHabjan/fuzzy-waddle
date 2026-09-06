import type { ActorId, PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import type { FactionType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
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

/** Squad membership and objective ownership. */
export interface AiSquadStateV1 {
  readonly squadId: AiSquadId;
  readonly role: string;
  readonly domain: "ground" | "water" | "air" | "mixed";
  readonly actorIds: readonly ActorId[];
  readonly objectiveId: string | null;
  readonly state: "forming" | "ready" | "moving" | "engaged" | "retreating" | "recovering";
}

/** Persisted transport phase without live actor references or promises. */
export interface AiTransportStateV1 {
  readonly planId: AiTransportPlanId;
  readonly phase: "prepare" | "board" | "travel" | "unload" | "handoff" | "return" | "completed" | "failed";
  readonly passengerIds: readonly ActorId[];
  readonly transportIds: readonly ActorId[];
  readonly queryIds: readonly string[];
}

/** Persisted wall/tower graph identity and bounded construction state. */
export interface AiFortificationStateV1 {
  readonly planId: AiFortificationPlanId;
  readonly nodeIds: readonly string[];
  readonly completedNodeIds: readonly string[];
  readonly protectedBaseIds: readonly AiBaseId[];
  readonly lifecycle: "planned" | "building" | "active" | "breached" | "abandoned";
}

/** Persisted support assignment and temporary-effect ownership. */
export interface AiSupportStateV1 {
  readonly planId: AiSupportPlanId;
  readonly actorIds: readonly ActorId[];
  readonly targetIds: readonly ActorId[];
  readonly expiresAt: AiDeadlineV1 | null;
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
  readonly lastCommittedTick: AiSimulationTick;
  readonly strategy: AiStrategyStateV1;
  readonly opening: AiOpeningStateV1;
  readonly knowledge: AiKnowledgeStateV1;
  readonly bases: readonly AiBaseStateV1[];
  readonly economyProduction: AiEconomyProductionStateV1;
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
