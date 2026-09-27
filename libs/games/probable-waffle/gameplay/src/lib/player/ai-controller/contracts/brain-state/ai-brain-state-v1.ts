import type { PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import type { FactionType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiSimulationTick } from "../ai-core-types";
import type { AiReservationV1, AiWaitEdgeV1 } from "../ai-dependency-contracts";
import type { AiAuthorityStateV1, AiCommandOutcomeV1 } from "../ai-command-contracts";
import type { AiBlockerV1, AiProgressContractV1, AiRecoveryEpisodeV1 } from "../ai-progress-contracts";
import type { AiLaneServiceStateV1 } from "../ai-lane-contracts";
import type { AiQueryStateV1 } from "../ai-query-contracts";
import type { AiStrategyStateV1 } from "./ai-strategy-state-v1";
import type { AiOpeningStateV1 } from "./ai-opening-state-v1";
import type { AiKnowledgeStateV1 } from "./ai-knowledge-state-v1";
import type { AiBaseStateV1 } from "./ai-base-state-v1";
import type { AiEconomyProductionStateV1 } from "./ai-economy-production-state-v1";
import type { AiRecoveryStateV1 } from "./ai-recovery-state-v1";
import type { AiSquadStateV1 } from "./ai-squad-state-v1";
import type { AiSkirmishStateV1 } from "./ai-skirmish-state-v1";
import type { AiTransportStateV1 } from "./ai-transport-state-v1";
import type { AiFortificationStateV1 } from "./ai-fortification-state-v1";
import type { AiSupportStateV1 } from "./ai-support-state-v1";
import type { AiSchedulerStateV1 } from "./ai-scheduler-state-v1";
import type { AiIdentityCountersV1 } from "./ai-identity-counters-v1";

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
