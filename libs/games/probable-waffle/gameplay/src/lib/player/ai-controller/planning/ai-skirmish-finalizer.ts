import { aiDeadline, type AiPlanId } from "../contracts/ai-core-types";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiManagerProposalV1 } from "./ai-manager-proposal";
import type { AiSkirmishProposalContext } from "./ai-skirmish-proposal-context";
import { intentBase, withTimeline } from "./ai-skirmish-support";

export const AI_CONCESSION_HOPELESS_TICKS = 1200;

export function finalizeAiSkirmishProposal(context: AiSkirmishProposalContext): AiManagerProposalV1 {
  const { observation, state } = context;
  const ownModeComplete = observation.modeGoals.some(
    (goal) => goal.owner === observation.playerNumber && goal.state === "completed"
  );
  const ownModeFailed = observation.modeGoals.some(
    (goal) => goal.owner === observation.playerNumber && goal.state === "failed"
  );
  const hasRecovery = observation.actors.some((actor) => actor.relation === "self" && actor.visibility === "owned");
  const hopelessSince =
    ownModeComplete || (hasRecovery && !ownModeFailed)
      ? null
      : (state.skirmish.mode.hopelessSinceTick ?? observation.tick);
  const concessionDue = hopelessSince !== null && observation.tick - hopelessSince >= AI_CONCESSION_HOPELESS_TICKS;
  let mode = {
    state:
      ownModeComplete || ownModeFailed
        ? "finished"
        : concessionDue
          ? "conceding"
          : hopelessSince !== null
            ? "hopeless"
            : "active",
    hopelessSinceTick: hopelessSince,
    concessionIntentId: state.skirmish.mode.concessionIntentId,
    lastReason: ownModeComplete
      ? "authoritative_mode_completed"
      : ownModeFailed
        ? "authoritative_mode_failed"
        : hopelessSince !== null
          ? "no_recoverable_owned_asset"
          : "recovery_route_available"
  } as const;
  if (!ownModeComplete && !ownModeFailed && concessionDue && mode.concessionIntentId === null) {
    const concedePlanId = "plan:mode:concession" as AiPlanId;
    const base = intentBase(state, concedePlanId, observation.tick, "concede", "army_threat", 1000);
    const concede: AiIntentV1 = { ...base, kind: "concede", reason: "sustained_no_recoverable_route" };
    context.intents.push(concede);
    mode = { ...mode, concessionIntentId: concede.intentId };
    context.skirmish = withTimeline(
      context.skirmish,
      observation.tick,
      "mode",
      concede.intentId,
      "concede_after_sustained_hopelessness"
    );
  }
  const retainedSquads = state.squads.filter(
    (squad) =>
      !["defense", "attack", "reserve", "scout"].includes(squad.role) &&
      squad.state !== "completed" &&
      squad.state !== "cancelled"
  );
  const squads = [...retainedSquads, ...context.nextSquads]
    .filter((squad, index, all) => all.findIndex((candidate) => candidate.squadId === squad.squadId) === index)
    .sort((left, right) => left.squadId.localeCompare(right.squadId));
  const resultSkirmish = { ...context.skirmish, mode };
  return {
    managerId: "stage9.skirmish",
    lane: "army_threat",
    evaluated: true,
    intents: context.intents,
    reasons: [
      `question:${context.currentQuestion?.questionId ?? "none"}`,
      `incidents:${context.liveIncidents.length}`,
      `combat:${context.combat.length}`,
      `mode:${mode.state}`
    ],
    statePatch: {
      knowledge: {
        ...state.knowledge,
        questions: context.questions,
        revision: state.knowledge.revision + (context.currentQuestion ? 1 : 0)
      },
      squads,
      strategy: context.opponent
        ? {
            ...state.strategy,
            stance: context.localThreat ? "defend" : "pressure",
            goalId: context.attackPlanId!,
            objectiveId: context.opponent.actorId
          }
        : state.strategy,
      skirmish: resultSkirmish
    }
  };
}
