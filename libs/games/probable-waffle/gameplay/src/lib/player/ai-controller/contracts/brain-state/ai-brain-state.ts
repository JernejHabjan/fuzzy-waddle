import type { PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import type { FactionType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiSimulationTick } from "../ai-core-types";
import type { AiReservation, AiWaitEdge } from "../ai-dependency-contracts";
import type { AiAuthorityState, AiCommandOutcome } from "../ai-command-contracts";
import type { AiBlocker, AiProgressContract, AiRecoveryEpisode } from "../ai-progress-contracts";
import type { AiLaneServiceState } from "../ai-lane-contracts";
import type { AiQueryState } from "../ai-query-contracts";
import type { AiStrategyState } from "./ai-strategy-state";
import type { AiOpeningState } from "./ai-opening-state";
import type { AiKnowledgeState } from "./ai-knowledge-state";
import type { AiBaseState } from "./ai-base-state";
import type { AiEconomyProductionState } from "./ai-economy-production-state";
import type { AiRecoveryState } from "./ai-recovery-state";
import type { AiSquadState } from "./ai-squad-state";
import type { AiSkirmishState } from "./ai-skirmish-state";
import type { AiTransportState } from "./ai-transport-state";
import type { AiFortificationState } from "./ai-fortification-state";
import type { AiSupportState } from "./ai-support-state";
import type { AiSchedulerState } from "./ai-scheduler-state";
import type { AiIdentityCounters } from "./ai-identity-counters";

/**
 * Versioned pure brain state. Each named slice has one future reducer owner; the legacy
 * blackboard may feed migration input but never owns or mutates this structure.
 */
export interface AiBrainState {
  readonly schemaVersion: 1;
  readonly playerNumber: PlayerNumber;
  readonly faction: FactionType;
  readonly profileVersion: string;
  /** Lobby-resolved fair difficulty persisted with the brain for replay and host-transfer provenance. */
  readonly profileDifficulty?: "easy" | "normal" | "hard";
  readonly lastCommittedTick: AiSimulationTick;
  readonly strategy: AiStrategyState;
  readonly opening: AiOpeningState;
  readonly knowledge: AiKnowledgeState;
  readonly skirmish: AiSkirmishState;
  readonly bases: readonly AiBaseState[];
  readonly economyProduction: AiEconomyProductionState;
  readonly recovery: AiRecoveryState;
  readonly reservations: readonly AiReservation[];
  readonly waitEdges: readonly AiWaitEdge[];
  readonly pendingOutcomes: readonly AiCommandOutcome[];
  readonly authority: AiAuthorityState;
  readonly squads: readonly AiSquadState[];
  readonly transport: readonly AiTransportState[];
  readonly fortifications: readonly AiFortificationState[];
  readonly support: readonly AiSupportState[];
  readonly progress: readonly AiProgressContract[];
  readonly blockers: readonly AiBlocker[];
  readonly recoveryEpisodes: readonly AiRecoveryEpisode[];
  readonly lanes: readonly AiLaneServiceState[];
  readonly queries: readonly AiQueryState[];
  readonly scheduler: AiSchedulerState;
  readonly identities: AiIdentityCounters;
}
