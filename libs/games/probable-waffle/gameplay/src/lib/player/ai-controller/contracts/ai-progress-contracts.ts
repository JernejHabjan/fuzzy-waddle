import type { AiBlockerId, AiDeadline, AiPlanId, AiRecoveryEpisodeId, AiSimulationTick } from "./ai-core-types";

/** Independent evidence that a plan changed the world in a useful way. */
export interface AiProgressEvidence {
  readonly kind:
    | "income_delivered"
    | "production_ready"
    | "route_advanced"
    | "objective_effect"
    | "prerequisite_completed"
    | "threat_reduced";
  readonly tick: AiSimulationTick;
  readonly sourceId: string;
  readonly amount: number | null;
}

/** Causal blocker with an absolute simulation deadline and explicit owner. */
export interface AiBlocker {
  readonly blockerId: AiBlockerId;
  readonly planId: AiPlanId;
  readonly cause:
    | "resource"
    | "supply"
    | "worker"
    | "producer"
    | "route"
    | "service_slot"
    | "command_uncertain"
    | "unsupported"
    | "technical_fault";
  readonly causeId: string;
  readonly enteredTick: AiSimulationTick;
  readonly deadline: AiDeadline;
  readonly status: "waiting" | "recovering" | "failed_optional" | "technical_fault";
}

/** Recovery attempt linked to the blocker and evidence that can close it. */
export interface AiRecoveryEpisode {
  readonly episodeId: AiRecoveryEpisodeId;
  readonly blockerId: AiBlockerId;
  readonly startedTick: AiSimulationTick;
  readonly attempt: number;
  readonly action: string;
  readonly deadline: AiDeadline;
  readonly result: "active" | "progressed" | "failed" | "superseded";
}

/** Persisted progress contract for a goal, child plan or command commitment. */
export interface AiProgressContract {
  readonly planId: AiPlanId;
  readonly expectedEvidenceKinds: readonly AiProgressEvidence["kind"][];
  readonly lastUsefulProgress: AiProgressEvidence | null;
  readonly milestoneDeadline: AiDeadline;
  readonly blockerId: AiBlockerId | null;
  readonly recoveryEpisodeIds: readonly AiRecoveryEpisodeId[];
}
