import type { PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import type { FactionType } from "@fuzzy-waddle/probable-waffle-protocol";
import { aiDeadline, assertAiNonNegativeInteger, type AiPlanStepId } from "../contracts/ai-core-types";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiProfileConfigV1 } from "../contracts/ai-profile-config-v1";
import type { AiServiceLaneV1 } from "../contracts/ai-lane-contracts";

const laneOrder: readonly AiServiceLaneV1[] = [
  "essential_economy",
  "supply_production",
  "scouting",
  "army_threat",
  "optional_infrastructure_tech"
];

/** Input needed to bootstrap new state from the current authoritative world. */
export interface CreateAiBrainStateV1Input {
  readonly playerNumber: PlayerNumber;
  readonly faction: FactionType;
  readonly profile: AiProfileConfigV1;
  readonly tick: number;
  readonly archetypeId: string;
  readonly completedOpeningStepIds?: readonly AiPlanStepId[];
}

/** Creates every persisted slice with deterministic defaults and no live references. */
export function createAiBrainStateV1(input: CreateAiBrainStateV1Input): AiBrainStateV1 {
  assertAiNonNegativeInteger(input.playerNumber, "playerNumber");
  assertAiNonNegativeInteger(input.tick, "tick");
  const completedStepIds = [...new Set(input.completedOpeningStepIds ?? [])].sort();

  return {
    schemaVersion: 1,
    playerNumber: input.playerNumber,
    faction: input.faction,
    profileVersion: input.profile.profileVersion,
    lastCommittedTick: input.tick,
    strategy: {
      stance: "opening",
      enteredTick: input.tick,
      goalId: "plan:opening",
      objectiveId: null,
      commitmentDeadline: aiDeadline(input.tick + 200),
      evidenceIds: [],
      suspendedGoalId: null
    },
    opening: {
      archetypeId: input.archetypeId,
      archetypeVersion: input.profile.archetypeVersion,
      selectedAtTick: input.tick,
      plan: {
        planId: "plan:opening",
        kind: "opening",
        lifecycle: "active",
        currentStepId: null,
        steps: completedStepIds.map((stepId) => ({
          stepId,
          state: "completed",
          demandIds: [],
          deadline: null,
          completedTick: input.tick
        })),
        suspendedByPlanId: null
      }
    },
    knowledge: { revision: 0, evidence: [], questions: [] },
    bases: [],
    economyProduction: { demands: [], forecasts: [] },
    reservations: [],
    waitEdges: [],
    pendingOutcomes: [],
    authority: {
      authorityEpoch: 0,
      processedSequenceWatermark: -1,
      pendingCommandIds: [],
      pendingLimit: 256,
      reconciliationDeadline: null,
      health: "healthy"
    },
    squads: [],
    transport: [],
    fortifications: [],
    support: [],
    progress: [],
    blockers: [],
    recoveryEpisodes: [],
    lanes: laneOrder.map((lane) => ({
      lane,
      deficit: 0,
      lastConsideredTick: input.tick,
      lastServicedTick: input.tick,
      continuationCursor: 0
    })),
    queries: [],
    scheduler: {
      decisionSequence: 0,
      accumulatorTicks: 0,
      catchUpLimit: 2,
      continuationCursors: [],
      rngState: [0]
    },
    identities: {
      nextPlan: 1,
      nextStep: 1,
      nextDemand: 1,
      nextClaim: 1,
      nextIntent: 1,
      nextEffect: 1,
      nextCommand: 1,
      nextEvidence: 1,
      nextQuestion: 1
    }
  };
}

/** Default provisional lease duration; callers convert it to an absolute simulation deadline. */
export const AI_PROVISIONAL_LEASE_DURATION_TICKS = 200;
