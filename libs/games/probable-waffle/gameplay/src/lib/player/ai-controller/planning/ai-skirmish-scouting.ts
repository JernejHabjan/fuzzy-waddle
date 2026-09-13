import { aiDeadline, type AiPlanId, type AiSquadId } from "../contracts/ai-core-types";
import type { AiSquadStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiSkirmishProposalContext } from "./ai-skirmish-proposal-context";
import { baseId, domains, intentBase, node, position, regionId, withTimeline } from "./ai-skirmish-support";

function appendNeutralClaim(context: AiSkirmishProposalContext): void {
  const neutral = context.observation.actors
    .filter((actor) => actor.relation === "neutral" && actor.visibility === "visible" && position(actor) !== undefined)
    .sort((left, right) => left.actorId.localeCompare(right.actorId))[0];
  const existingNeutralClaim = context.state.squads.find(
    (squad) =>
      squad.role === "scout" &&
      squad.objectiveId === `neutral:${neutral?.actorId ?? "none"}` &&
      squad.state !== "completed"
  );
  if (!neutral || !context.combat[0] || existingNeutralClaim || context.opponent) return;
  const claimantId = "squad:scout:neutral" as AiSquadId;
  const claimantPlanId = `plan:${claimantId}` as AiPlanId;
  const claimant: AiSquadStateV1 = {
    squadId: claimantId,
    role: "scout",
    domain: domains(context.combat[0]!).includes("air")
      ? "air"
      : domains(context.combat[0]!).includes("water")
        ? "water"
        : "ground",
    actorIds: [context.combat[0].actorId],
    objectiveId: `neutral:${neutral.actorId}`,
    state: "moving",
    lifecycle: {
      targetPlayerNumber: null,
      targetRegionId: regionId(neutral),
      protectedBaseId: baseId(context.state),
      rallyNodeId: node(context.combat[0]!) ?? null,
      retreatNodeId: context.homeAccess ?? null,
      createdTick: context.observation.tick,
      assemblyDeadline: aiDeadline(context.observation.tick + 200),
      effectDeadline: aiDeadline(context.observation.tick + 800),
      lastUsefulEffectTick: null,
      recoveryAttempt: 0,
      terminalReason: null
    }
  };
  context.nextSquads.push(claimant);
  context.intents.push({
    ...intentBase(
      context.state,
      claimantPlanId,
      context.observation.tick,
      `neutral:${neutral.actorId}`,
      "scouting",
      620
    ),
    kind: "move",
    actorIds: claimant.actorIds,
    logicalPosition: position(neutral)!,
    claims: [
      {
        claimId: `claim:neutral:${neutral.actorId}` as AiSquadStateV1["squadId"],
        kind: "actor",
        actorId: claimant.actorIds[0]!
      }
    ]
  });
  context.skirmish = withTimeline(
    context.skirmish,
    context.observation.tick,
    "mission",
    claimant.squadId,
    `neutral_claim:${neutral.actorId}`
  );
}

function appendFrontierScout(context: AiSkirmishProposalContext): void {
  const { currentQuestion, combat, observation, activeScout } = context;
  if (context.opponent || !currentQuestion || !combat[0] || !observation.map?.accessGraph) return;
  const target = observation.map.accessGraph.nodes.find(
    (candidate) => candidate.nodeId === currentQuestion.kind.replace("safe_route:", "")
  );
  const scoutPosition = target?.representativePosition;
  if (!scoutPosition) return;
  const scoutId = activeScout?.squadId ?? ("squad:scout:primary" as AiSquadId);
  const scoutPlanId = `plan:${scoutId}` as AiPlanId;
  const continuingScout = activeScout?.objectiveId === currentQuestion.questionId;
  const retainedScoutMembers =
    continuingScout && activeScout ? combat.filter((actor) => activeScout.actorIds.includes(actor.actorId)) : [];
  const scoutMembers =
    retainedScoutMembers.length > 0 ? retainedScoutMembers : combat.slice(0, Math.min(3, combat.length));
  const scout: AiSquadStateV1 = {
    squadId: scoutId,
    role: "scout",
    domain: domains(scoutMembers[0] ?? combat[0]!).includes("air")
      ? "air"
      : domains(scoutMembers[0] ?? combat[0]!).includes("water")
        ? "water"
        : "ground",
    actorIds: scoutMembers.map((actor) => actor.actorId),
    objectiveId: currentQuestion.questionId,
    state: "moving",
    lifecycle: {
      targetPlayerNumber: null,
      targetRegionId: target.nodeId,
      protectedBaseId: baseId(context.state),
      rallyNodeId: node(combat[0]!) ?? null,
      retreatNodeId: context.homeAccess ?? null,
      createdTick: continuingScout ? (activeScout?.lifecycle?.createdTick ?? observation.tick) : observation.tick,
      assemblyDeadline: continuingScout
        ? (activeScout?.lifecycle?.assemblyDeadline ?? aiDeadline(observation.tick + 200))
        : aiDeadline(observation.tick + 200),
      effectDeadline: continuingScout
        ? (activeScout?.lifecycle?.effectDeadline ?? aiDeadline(observation.tick + 800))
        : aiDeadline(observation.tick + 800),
      lastUsefulEffectTick: continuingScout ? (activeScout?.lifecycle?.lastUsefulEffectTick ?? null) : null,
      recoveryAttempt: continuingScout ? (activeScout?.lifecycle?.recoveryAttempt ?? 0) : 0,
      terminalReason: null
    },
    ...(continuingScout && activeScout?.tactics ? { tactics: activeScout.tactics } : {})
  };
  context.nextSquads.push(scout);
  if (!continuingScout || !activeScout?.tactics)
    context.intents.push({
      ...intentBase(
        context.state,
        scoutPlanId,
        observation.tick,
        `scout:${currentQuestion.questionId}`,
        "scouting",
        700
      ),
      kind: "scout",
      actorIds: scout.actorIds,
      logicalPosition: scoutPosition
    });
}

export function advanceAiSkirmishScouting(context: AiSkirmishProposalContext): void {
  appendNeutralClaim(context);
  appendFrontierScout(context);
}
