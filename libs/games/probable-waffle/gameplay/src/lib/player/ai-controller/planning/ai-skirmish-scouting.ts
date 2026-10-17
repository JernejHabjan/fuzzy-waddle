import {
  aiDeadline,
  type AiAccessNodeId,
  type AiClaimId,
  type AiPlanId,
  type AiSquadId
} from "../contracts/ai-core-types";
import type { AiSquadStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiSkirmishProposalContext } from "./ai-skirmish-proposal-context";
import {
  baseId,
  domains,
  intentBase,
  node,
  position,
  regionId,
  routeCapability,
  withTimeline
} from "./ai-skirmish-support";
import { queryAiAccessRouteV1 } from "./ai-access-graph-v1";

/** Scouting has no transport child owner; only an immediately executable route can admit a member. */
function canScoutNode(
  context: AiSkirmishProposalContext,
  actor: AiSkirmishProposalContext["combat"][number],
  targetNode: AiAccessNodeId
): boolean {
  const graph = context.observation.map?.accessGraph;
  const sourceNode = node(actor);
  if (!graph || !sourceNode || context.primaryOwnedActors.has(actor.actorId)) return false;
  return (
    queryAiAccessRouteV1(graph, {
      queryId: `scout:${context.observation.tick}:${actor.actorId}:${targetNode}`,
      kind: "movement",
      fromNodeId: sourceNode,
      toNodeId: targetNode,
      capabilities: routeCapability(context.observation, [actor], context.catalog),
      firingNodeIds: []
    }).kind === "direct"
  );
}

function appendNeutralClaim(context: AiSkirmishProposalContext): void {
  if (context.opponent) return;
  const previous = context.state.squads.find((squad) => squad.squadId === "squad:scout:neutral");
  if (previous) {
    const members = context.combat.filter(
      (actor) => previous.actorIds.includes(actor.actorId) && !context.primaryOwnedActors.has(actor.actorId)
    );
    const covered =
      previous.lifecycle?.targetRegionId !== null &&
      context.observation.map?.scoutCoverageAccessNodeIds.some(
        (nodeId) => nodeId === previous.lifecycle?.targetRegionId
      ) === true;
    const expired =
      previous.lifecycle !== undefined && previous.lifecycle.effectDeadline.dueTick <= context.observation.tick;
    const terminal = previous.state === "completed" || previous.state === "cancelled";
    const state = terminal
      ? previous.state
      : covered
        ? "completed"
        : expired || members.length === 0
          ? "cancelled"
          : previous.state;
    // Keep the mission deadline and terminal record: a new proposal must not renew or redispatch the same claim.
    context.nextSquads.push({
      ...previous,
      state,
      actorIds: members.map((actor) => actor.actorId),
      ...(previous.lifecycle
        ? {
            lifecycle: {
              ...previous.lifecycle,
              terminalReason: terminal
                ? previous.lifecycle.terminalReason
                : covered
                  ? "region_observed"
                  : expired
                    ? "scout_deadline"
                    : members.length === 0
                      ? "members_unavailable"
                      : null
            }
          }
        : {})
    });
    if (state !== "completed" && state !== "cancelled")
      members.forEach((actor) => context.primaryOwnedActors.add(actor.actorId));
    return;
  }
  const candidates = context.observation.actors
    .filter((actor) => actor.relation === "neutral" && actor.visibility === "visible" && position(actor) !== undefined)
    .filter(
      (actor) =>
        actor.resourceState.status === "known" &&
        actor.resourceState.value.available.status === "known" &&
        actor.resourceState.value.available.value > 0
    )
    .sort((left, right) => left.actorId.localeCompare(right.actorId));
  const neutral = candidates.find((actor) => {
    const targetNode = node(actor);
    return targetNode !== undefined && context.combat.some((member) => canScoutNode(context, member, targetNode));
  });
  const targetNode = node(neutral);
  const member = targetNode ? context.combat.find((actor) => canScoutNode(context, actor, targetNode)) : undefined;
  const destination = context.observation.map?.accessGraph?.nodes.find((entry) => entry.nodeId === targetNode);
  if (!neutral || !member || !destination) return;
  const claimantId = "squad:scout:neutral" as AiSquadId;
  const claimantPlanId = `plan:${claimantId}` as AiPlanId;
  const claimant: AiSquadStateV1 = {
    squadId: claimantId,
    role: "scout",
    domain: domains(member).includes("air") ? "air" : domains(member).includes("water") ? "water" : "ground",
    actorIds: [member.actorId],
    objectiveId: `neutral:${neutral.actorId}`,
    state: "moving",
    lifecycle: {
      targetPlayerNumber: null,
      targetRegionId: regionId(neutral),
      protectedBaseId: baseId(context.state),
      rallyNodeId: node(member) ?? null,
      retreatNodeId: context.homeAccess ?? null,
      createdTick: context.observation.tick,
      assemblyDeadline: aiDeadline(context.observation.tick + 200),
      effectDeadline: aiDeadline(context.observation.tick + 800),
      lastUsefulEffectTick: null,
      recoveryAttempt: 0,
      terminalReason: null
    }
  };
  context.primaryOwnedActors.add(member.actorId);
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
    // Neutral resource/scenery footprints are occupied; visit the fair graph's traversable region instead.
    logicalPosition: destination.representativePosition,
    claims: [
      {
        claimId: `claim:neutral:${neutral.actorId}` as AiClaimId,
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
  const { currentQuestion, combat, observation } = context;
  const activeScout = context.activeScout?.squadId === "squad:scout:neutral" ? undefined : context.activeScout;
  if (context.opponent || !currentQuestion || !combat[0] || !observation.map?.accessGraph) return;
  const searchPoint = currentQuestion.kind.startsWith("explore:")
    ? observation.map.scoutSearchPoints?.find(
        (point) => point.pointId === currentQuestion.kind.slice("explore:".length)
      )
    : undefined;
  const target = searchPoint
    ? { nodeId: searchPoint.accessNodeId, representativePosition: searchPoint.position }
    : observation.map.accessGraph.nodes.find(
        (candidate) => candidate.nodeId === currentQuestion.kind.replace("safe_route:", "")
      );
  if (!target) return;
  const scoutPosition = target.representativePosition;
  const eligible = combat.filter((actor) => canScoutNode(context, actor, target.nodeId));
  const scoutId = activeScout?.squadId ?? ("squad:scout:primary" as AiSquadId);
  const scoutPlanId = `plan:${scoutId}` as AiPlanId;
  const continuingScout = activeScout?.objectiveId === currentQuestion.questionId;
  const retainedScoutMembers =
    continuingScout && activeScout ? eligible.filter((actor) => activeScout.actorIds.includes(actor.actorId)) : [];
  const scoutMembers = retainedScoutMembers.length > 0 ? retainedScoutMembers : eligible.slice(0, 3);
  const lead = scoutMembers[0];
  if (!lead) return;
  const sameMembers =
    continuingScout &&
    activeScout !== undefined &&
    activeScout.actorIds.length === scoutMembers.length &&
    scoutMembers.every((actor) => activeScout.actorIds.includes(actor.actorId));
  const scout: AiSquadStateV1 = {
    squadId: scoutId,
    role: "scout",
    domain: domains(lead).includes("air") ? "air" : domains(lead).includes("water") ? "water" : "ground",
    actorIds: scoutMembers.map((actor) => actor.actorId),
    objectiveId: currentQuestion.questionId,
    state: "moving",
    lifecycle: {
      targetPlayerNumber: null,
      targetRegionId: target.nodeId,
      protectedBaseId: baseId(context.state),
      rallyNodeId: node(lead) ?? null,
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
    ...(sameMembers && activeScout?.tactics ? { tactics: activeScout.tactics } : {})
  };
  scout.actorIds.forEach((actorId) => context.primaryOwnedActors.add(actorId));
  context.nextSquads.push(scout);
  if (!sameMembers || !activeScout?.tactics)
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
      claims: scout.actorIds.map((actorId) => ({
        claimId: `claim:scout:${scoutId}:${actorId}` as AiClaimId,
        kind: "actor",
        actorId
      })),
      logicalPosition: scoutPosition
    });
}

export function advanceAiSkirmishScouting(context: AiSkirmishProposalContext): void {
  appendNeutralClaim(context);
  appendFrontierScout(context);
}
