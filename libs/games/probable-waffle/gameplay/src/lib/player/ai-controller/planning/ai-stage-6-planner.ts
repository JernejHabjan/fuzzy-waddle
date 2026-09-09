import { aiDeadline, type AiPlanId } from "../contracts/ai-core-types";
import type { AiBrainStateV1, AiStrategyStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCommandOutcomeV1 } from "../contracts/ai-command-contracts";
import type { AiIntentDecisionV1, AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiProfileConfigV1 } from "../contracts/ai-profile-config-v1";
import type { AiManagerProposalV1 } from "./ai-manager-proposal";

/** The shared, deterministic Stage 6 reducer result. It owns only durable planning state. */
export interface AiStage6PlanningResultV1 {
  readonly state: AiBrainStateV1;
  readonly proposals: readonly AiIntentV1[];
  readonly preDecisions: readonly AiIntentDecisionV1[];
}

const LANE_ORDER = [
  "essential_economy",
  "supply_production",
  "scouting",
  "army_threat",
  "optional_infrastructure_tech"
] as const;

function strategyFor(observation: AiObservationV1, state: AiBrainStateV1): AiStrategyStateV1 {
  const previous = state.strategy;
  const visibleThreat = observation.threatSummary.visibleEnemyActorIds.length > 0;
  const activeObjective = observation.modeGoals.find((goal) => goal.state === "active")?.id ?? null;
  const openingComplete = state.opening.plan.lifecycle === "completed";
  const candidate = visibleThreat ? "defend" : openingComplete ? "stabilize" : "opening";
  const canInterrupt =
    candidate === "defend" || previous.goalId === null || observation.tick >= previous.commitmentDeadline.dueTick;
  if (candidate === previous.stance || !canInterrupt) return previous;
  return {
    stance: candidate,
    enteredTick: observation.tick,
    goalId: candidate === "opening" ? "plan:opening" : previous.goalId,
    objectiveId: activeObjective,
    commitmentDeadline: aiDeadline(observation.tick + 200),
    evidenceIds: previous.evidenceIds,
    suspendedGoalId: candidate === "defend" ? previous.goalId : null
  };
}

function isTerminal(outcome: AiCommandOutcomeV1): boolean {
  return (
    outcome.kind === "completed" ||
    outcome.kind === "rejected" ||
    outcome.kind === "cancelled" ||
    outcome.kind === "failed"
  );
}

function reconcileReservations(state: AiBrainStateV1, outcomes: readonly AiCommandOutcomeV1[], tick: number) {
  const terminalCommands = new Set<string>(outcomes.filter(isTerminal).map((outcome) => outcome.identity.commandId));
  return state.reservations.filter((reservation) => {
    if (reservation.state.kind === "provisional") return reservation.state.expiresAt.dueTick > tick;
    if (reservation.state.kind === "dispatched") return !terminalCommands.has(reservation.state.commandId);
    return true;
  });
}

function hasCycle(state: AiBrainStateV1, planId: AiPlanId): boolean {
  const next = new Map(
    state.waitEdges.filter((edge) => edge.toPlanId !== null).map((edge) => [edge.fromPlanId, edge.toPlanId!])
  );
  let cursor: AiPlanId | undefined = planId;
  const seen = new Set<AiPlanId>();
  while (cursor) {
    if (seen.has(cursor)) return true;
    seen.add(cursor);
    cursor = next.get(cursor);
  }
  return false;
}

/**
 * Applies the Stage 6 fair-lane, stance, reservation and progress-supervision invariants before arbitration.
 * It deliberately does not invent domain actions: Stage 7+ managers supply those proposals through this boundary.
 */
export function planAiStage6V1(
  observation: AiObservationV1,
  previous: AiBrainStateV1,
  outcomes: readonly AiCommandOutcomeV1[],
  batches: readonly AiManagerProposalV1[],
  profile: AiProfileConfigV1
): AiStage6PlanningResultV1 {
  const sortedBatches = [...batches].sort((left, right) => left.managerId.localeCompare(right.managerId));
  const considered = new Set(sortedBatches.filter((batch) => batch.evaluated).map((batch) => batch.lane));
  const lanes = LANE_ORDER.map((lane) => {
    const existing = previous.lanes.find((entry) => entry.lane === lane);
    const wasConsidered = considered.has(lane);
    return {
      lane,
      deficit: wasConsidered ? 0 : Math.min(8, (existing?.deficit ?? 0) + 1),
      lastConsideredTick: wasConsidered
        ? observation.tick
        : (existing?.lastConsideredTick ?? previous.lastCommittedTick),
      lastServicedTick: wasConsidered ? observation.tick : (existing?.lastServicedTick ?? previous.lastCommittedTick),
      continuationCursor: ((existing?.continuationCursor ?? 0) + 1) % Math.max(1, profile.maxIntentProposalsPerStep)
    };
  });
  const reservations = reconcileReservations(previous, outcomes, observation.tick);
  const overdue = previous.progress.filter((progress) => progress.milestoneDeadline.dueTick <= observation.tick);
  const blockers = [...previous.blockers];
  for (const progress of overdue) {
    if (blockers.some((blocker) => blocker.planId === progress.planId && blocker.status !== "failed_optional"))
      continue;
    blockers.push({
      blockerId: `blocker:progress:${progress.planId}:${progress.milestoneDeadline.dueTick}`,
      planId: progress.planId,
      cause: "service_slot",
      causeId: "no_useful_progress",
      enteredTick: observation.tick,
      deadline: aiDeadline(observation.tick + 200),
      status: "recovering"
    });
  }
  const cyclicPlan = [...new Set(previous.waitEdges.map((edge) => edge.fromPlanId))]
    .sort()
    .find((planId) => hasCycle(previous, planId));
  const preDecisions: AiIntentDecisionV1[] = [];
  if (cyclicPlan) {
    const reversible = reservations
      .filter((reservation) => reservation.ownerPlanId === cyclicPlan && reservation.state.kind === "provisional")
      .sort((left, right) => left.claimId.localeCompare(right.claimId))[0];
    if (reversible) {
      preDecisions.push({
        outcome: "rejected",
        intent: sortedBatches.flatMap((batch) => batch.intents).find((intent) => intent.planId === cyclicPlan) ?? {
          kind: "concede",
          intentId: "intent:supervisor:cycle",
          effectId: "effect:supervisor:cycle",
          planId: cyclicPlan,
          demandId: null,
          lane: "essential_economy",
          proposedTick: observation.tick,
          urgencyClass: 0,
          utility: 0,
          preconditions: [],
          claims: [],
          reasonCode: "dependency_cycle",
          reason: "dependency_cycle"
        },
        reason: "claim_conflict",
        detail: `dependency_cycle_released:${reversible.claimId}`
      });
    }
  }
  return {
    state: {
      ...previous,
      lastCommittedTick: observation.tick,
      strategy: strategyFor(observation, previous),
      reservations: cyclicPlan
        ? reservations.filter(
            (reservation) => !(reservation.ownerPlanId === cyclicPlan && reservation.state.kind === "provisional")
          )
        : reservations,
      pendingOutcomes: outcomes.slice(-previous.authority.pendingLimit),
      authority: {
        ...previous.authority,
        health: previous.authority.health === "technical_fault" ? "technical_fault" : "healthy"
      },
      blockers: blockers.sort(
        (left, right) => left.enteredTick - right.enteredTick || left.blockerId.localeCompare(right.blockerId)
      ),
      lanes,
      scheduler: { ...previous.scheduler, decisionSequence: previous.scheduler.decisionSequence + 1 }
    },
    proposals: sortedBatches.flatMap((batch) => batch.intents),
    preDecisions
  };
}
