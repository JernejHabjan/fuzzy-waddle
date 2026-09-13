import type { AiRouteRequestV1 } from "../contracts/ai-access-graph-v1";
import type { AiManagerProposalV1 } from "./ai-manager-proposal";
import type { AiProfileConfigV1 } from "../contracts/ai-profile-config-v1";
import { aiDeadline, type AiPlanId, type AiSquadId } from "../contracts/ai-core-types";
import type { AiSquadStateV1 } from "../contracts/ai-brain-state-v1";
import { queryAiAccessRouteV1 } from "./ai-access-graph-v1";
import type { AiSkirmishProposalContext } from "./ai-skirmish-proposal-context";
import { createAiTransportPlanV1 } from "./ai-transport-manager";
import { AI_SKIRMISH_ASSEMBLY_TIMEOUT_TICKS } from "./ai-skirmish-defense";
import {
  canTarget,
  domains,
  intentBase,
  node,
  position,
  regionId,
  routeCapability,
  withTimeline
} from "./ai-skirmish-support";

function selectOpponent(context: AiSkirmishProposalContext) {
  const focusedPlayer = context.activeAttack?.lifecycle?.targetPlayerNumber;
  if (focusedPlayer === null || focusedPlayer === undefined)
    return context.visibleEnemies[0] ?? context.rememberedEnemies[0];
  return (
    context.visibleEnemies.find((candidate) => candidate.owner === focusedPlayer) ??
    context.rememberedEnemies.find((candidate) => candidate.owner === focusedPlayer) ??
    context.visibleEnemies[0] ??
    context.rememberedEnemies[0]
  );
}

function appendReserve(context: AiSkirmishProposalContext): void {
  const reserveCount = context.combat.length >= 8 ? Math.ceil(context.combat.length * 0.25) : 0;
  const reserveMembers = context.combat
    .filter((actor) => !context.primaryOwnedActors.has(actor.actorId))
    .slice(0, reserveCount);
  if (reserveMembers.length === 0) return;
  reserveMembers.forEach((actor) => context.primaryOwnedActors.add(actor.actorId));
  const reserveId = "squad:reserve:home" as AiSquadId;
  context.nextSquads.push({
    squadId: reserveId,
    role: "reserve",
    domain: domains(reserveMembers[0]!).includes("air")
      ? "air"
      : domains(reserveMembers[0]!).includes("water")
        ? "water"
        : "ground",
    actorIds: reserveMembers.map((actor) => actor.actorId),
    objectiveId: null,
    state: "ready",
    lifecycle: {
      targetPlayerNumber: null,
      targetRegionId: null,
      protectedBaseId: context.state.bases.find((base) => base.active)?.baseId ?? "base:home",
      rallyNodeId: context.homeAccess ?? null,
      retreatNodeId: context.homeAccess ?? null,
      createdTick:
        context.state.squads.find((squad) => squad.squadId === reserveId)?.lifecycle?.createdTick ??
        context.observation.tick,
      assemblyDeadline: aiDeadline(context.observation.tick + AI_SKIRMISH_ASSEMBLY_TIMEOUT_TICKS),
      effectDeadline: aiDeadline(context.observation.tick + 2400),
      lastUsefulEffectTick: null,
      recoveryAttempt: 0,
      terminalReason: null
    }
  });
}

function createAttackSquad(
  context: AiSkirmishProposalContext,
  opponent: NonNullable<AiSkirmishProposalContext["opponent"]>,
  attackers: readonly AiSkirmishProposalContext["combat"][number][],
  route: ReturnType<typeof queryAiAccessRouteV1> | undefined,
  sourceNode: ReturnType<typeof node>
): AiSquadStateV1 {
  const assemblyExpired =
    context.activeAttack?.lifecycle?.assemblyDeadline.dueTick !== undefined &&
    context.activeAttack.lifecycle.assemblyDeadline.dueTick <= context.observation.tick;
  const requiredForVisibleThreat = Math.max(6, Math.ceil(context.visibleEnemies.length * 1.2));
  const fullEngagement =
    attackers.length >= requiredForVisibleThreat && attackers.length * 1000 >= requiredForVisibleThreat * 750;
  const isReachable = route?.kind === "direct" || route?.kind === "air_or_naval_objective";
  const attackState: AiSquadStateV1["state"] =
    isReachable && (fullEngagement || assemblyExpired) ? "moving" : "forming";
  const attackId = context.activeAttack?.squadId ?? ("squad:attack:primary" as AiSquadId);
  context.attackPlanId = `plan:${attackId}` as AiPlanId;
  return {
    squadId: attackId,
    role: "attack",
    domain: domains(attackers[0]!).includes("air")
      ? "air"
      : domains(attackers[0]!).includes("water")
        ? "water"
        : "ground",
    actorIds: attackers.map((actor) => actor.actorId),
    objectiveId: opponent.visibility === "visible" ? opponent.actorId : `hypothesis:${opponent.evidenceId}`,
    state: attackState,
    lifecycle: {
      targetPlayerNumber: context.activeAttack?.lifecycle?.targetPlayerNumber ?? opponent.owner,
      targetRegionId: context.activeAttack?.lifecycle?.targetRegionId ?? regionId(opponent),
      protectedBaseId: null,
      rallyNodeId: sourceNode ?? null,
      retreatNodeId: context.homeAccess ?? null,
      createdTick: context.activeAttack?.lifecycle?.createdTick ?? context.observation.tick,
      assemblyDeadline:
        context.activeAttack?.lifecycle?.assemblyDeadline ??
        aiDeadline(context.observation.tick + AI_SKIRMISH_ASSEMBLY_TIMEOUT_TICKS),
      effectDeadline: context.activeAttack?.lifecycle?.effectDeadline ?? aiDeadline(context.observation.tick + 2400),
      lastUsefulEffectTick: context.activeAttack?.lifecycle?.lastUsefulEffectTick ?? null,
      recoveryAttempt: context.activeAttack?.lifecycle?.recoveryAttempt ?? 0,
      terminalReason: route?.kind === "impossible" ? route.reason : null
    },
    ...(context.activeAttack?.tactics ? { tactics: context.activeAttack.tactics } : {})
  };
}

function transportProposal(
  context: AiSkirmishProposalContext,
  attack: AiSquadStateV1,
  attackers: readonly AiSkirmishProposalContext["combat"][number][],
  route: Extract<ReturnType<typeof queryAiAccessRouteV1>, { readonly kind: "water_transport" | "air_transport" }>,
  sourceNode: NonNullable<ReturnType<typeof node>>,
  targetNode: NonNullable<ReturnType<typeof node>>
): AiManagerProposalV1 | undefined {
  const transportPlanId = `transport:mission:${attack.squadId}` as const;
  if (context.state.transport.some((transport) => transport.planId === transportPlanId)) return undefined;
  const passengers = attackers.slice(0, Math.max(1, Math.min(attackers.length, 6))).map((actor, index) => ({
    actorId: actor.actorId,
    role: "combat" as const,
    indispensable: index === 0,
    handoff: "squad" as const
  }));
  return {
    managerId: "stage9.skirmish",
    lane: "army_threat",
    evaluated: true,
    intents: context.intents,
    reasons: ["transport_child_seeded", route.kind],
    statePatch: {
      knowledge: {
        ...context.state.knowledge,
        questions: context.questions,
        revision: context.state.knowledge.revision + (context.currentQuestion ? 1 : 0)
      },
      squads: context.nextSquads,
      strategy: {
        ...context.state.strategy,
        stance: "pressure",
        goalId: context.attackPlanId!,
        objectiveId: attack.objectiveId
      },
      skirmish: withTimeline(
        context.skirmish,
        context.observation.tick,
        "mission",
        attack.squadId,
        `transport:${route.kind}`
      ),
      transportAppend: [
        createAiTransportPlanV1({
          planId: transportPlanId,
          routeRequest: {
            queryId: route.queryId,
            kind: "movement",
            fromNodeId: sourceNode,
            toNodeId: targetNode,
            capabilities: routeCapability(context.observation, attackers, context.catalog),
            firingNodeIds: []
          },
          route,
          tick: context.observation.tick,
          missionKind: "army_transfer",
          estimatedTravelTicks: Math.max(1, route.distanceCost),
          passengers
        })
      ]
    }
  };
}

export function advanceAiSkirmishOffense(
  context: AiSkirmishProposalContext,
  profile: AiProfileConfigV1
): AiManagerProposalV1 | undefined {
  context.opponent = selectOpponent(context);
  appendReserve(context);
  const attackers = context.combat.filter((actor) => !context.primaryOwnedActors.has(actor.actorId));
  const attackId = context.activeAttack?.squadId ?? ("squad:attack:primary" as AiSquadId);
  context.attackPlanId = `plan:${attackId}` as AiPlanId;
  if (!context.opponent || attackers.length === 0) return undefined;
  const targetNode = node(context.opponent);
  const sourceNode = node(attackers[0]);
  const route =
    sourceNode && targetNode && context.observation.map?.accessGraph
      ? queryAiAccessRouteV1(context.observation.map.accessGraph, {
          queryId: `query:mission:${attackId}:${context.observation.generation}`,
          kind: "firing_position",
          fromNodeId: sourceNode,
          toNodeId: targetNode,
          capabilities: routeCapability(context.observation, attackers, context.catalog),
          firingNodeIds: [targetNode]
        } satisfies AiRouteRequestV1)
      : undefined;
  const attack = createAttackSquad(context, context.opponent, attackers, route, sourceNode);
  context.nextSquads.push(attack);
  if ((route?.kind === "water_transport" || route?.kind === "air_transport") && sourceNode && targetNode)
    return transportProposal(context, attack, attackers, route, sourceNode, targetNode);
  const launchRecorded = context.state.skirmish.timeline.some(
    (event) => event.kind === "mission" && event.subjectId === attackId && event.detail.startsWith("launch:")
  );
  if (
    !launchRecorded &&
    attack.state === "moving" &&
    route &&
    context.state.squads.filter((squad) => squad.role === "attack" && squad.state !== "completed").length <
      profile.voluntaryOffensiveMissionLimit + 1
  ) {
    const targetPosition = position(context.opponent);
    if (context.opponent.visibility === "visible" && canTarget(attackers[0]!, context.opponent))
      context.intents.push({
        ...intentBase(
          context.state,
          context.attackPlanId,
          context.observation.tick,
          `attack:${context.opponent.actorId}`,
          "army_threat",
          760
        ),
        kind: "attack",
        actorIds: attack.actorIds,
        targetActorId: context.opponent.actorId,
        targetPosition: null
      });
    else if (targetPosition)
      context.intents.push({
        ...intentBase(
          context.state,
          context.attackPlanId,
          context.observation.tick,
          `search:${context.opponent.evidenceId}`,
          "scouting",
          650
        ),
        kind: "scout",
        actorIds: attack.actorIds,
        logicalPosition: targetPosition
      });
    context.skirmish = withTimeline(
      context.skirmish,
      context.observation.tick,
      "mission",
      attackId,
      `launch:${route.kind}`
    );
  }
  return undefined;
}
