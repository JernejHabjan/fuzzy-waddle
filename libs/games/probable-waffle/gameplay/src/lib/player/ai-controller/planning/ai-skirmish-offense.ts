import type { AiManagerProposalV1 } from "./ai-manager-proposal";
import { OrderType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import type { AiProfileConfigV1 } from "../contracts/ai-profile-config-v1";
import { aiDeadline, type AiClaimId, type AiPlanId, type AiSquadId } from "../contracts/ai-core-types";
import type { AiSquadStateV1 } from "../contracts/ai-brain-state-v1";
import { queryAiAccessRouteV1 } from "./ai-access-graph-v1";
import type { AiSkirmishProposalContext } from "./ai-skirmish-proposal-context";
import { createAiTransportPlanV1 } from "./ai-transport-manager";
import { AI_SKIRMISH_ASSEMBLY_TIMEOUT_TICKS } from "./ai-skirmish-defense";
import { selectAiOffensiveOpportunity } from "./select-ai-offensive-opportunity";
import { canSeeTarget } from "./ai-tactics-combat";
import {
  selectAiAttackApproachPositions,
  targetFootprintRadiusTiles
} from "./ai-tactics-approach-positions";
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

function appendReserve(context: AiSkirmishProposalContext, committedAttackers: ReadonlySet<string>): void {
  const assignedDefenders = new Set(
    context.nextSquads.filter((squad) => squad.role === "defense").flatMap((squad) => squad.actorIds)
  ).size;
  // Existing defense already protects home; do not reserve the same protection budget twice.
  const reserveCount = Math.max(
    0,
    (context.combat.length >= 8 ? Math.ceil(context.combat.length * 0.25) : 0) - assignedDefenders
  );
  const reserveMembers = context.combat
    .filter(
      (actor) =>
        !context.primaryOwnedActors.has(actor.actorId) &&
        !committedAttackers.has(actor.actorId) &&
        !domains(actor).includes("water") &&
        !domains(actor).includes("air")
    )
    .sort(
      (left, right) =>
        Number(domains(left).includes("air")) - Number(domains(right).includes("air")) ||
        left.actorId.localeCompare(right.actorId)
    )
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

function actorClaims(actorIds: readonly string[]): AiIntentV1["claims"] {
  return actorIds.map((actorId) => ({
    claimId: `claim:stage9:actor:${actorId}` as AiClaimId,
    kind: "actor" as const,
    actorId: actorId as ActorId
  }));
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
  const fullEngagement = (context.assessment?.readyForce ?? 0) >= (context.assessment?.requiredForce ?? 2);
  const severeCounterforce =
    (context.assessment?.visibleThreatCount ?? 0) >= Math.max(3, (context.assessment?.readyForce ?? 0) * 2);
  const requiredForce = context.assessment?.requiredForce ?? 2;
  const minimumTimedForce = requiredForce <= 3 ? 1 : Math.ceil(requiredForce * 0.75);
  const timedEngagement =
    assemblyExpired &&
    !severeCounterforce &&
    (context.assessment?.readyForce ?? 0) > (context.assessment?.visibleThreatCount ?? 0) &&
    requiredForce <= 5 &&
    route?.kind === "direct" &&
    route.domain === "ground" &&
    (context.assessment?.readyForce ?? 0) >= minimumTimedForce;
  const isReachable = route?.kind === "direct" || route?.kind === "air_or_naval_objective";
  const attackState: AiSquadStateV1["state"] =
    isReachable && context.assessment?.choice !== "recover" && (fullEngagement || timedEngagement)
      ? "moving"
      : "forming";
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
        stance: context.assessment?.choice === "finish" ? "finish" : "pressure",
        goalId: context.attackPlanId!,
        objectiveId: attack.objectiveId,
        assessment: context.assessment
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
  const activeAttack = context.activeAttack;
  const liveTarget = context.visibleEnemies.find((actor) => actor.actorId === activeAttack?.objectiveId);
  const missionSquads = activeAttack
    ? context.state.squads.filter(
        (squad) =>
          squad.role === "attack" &&
          squad.squadId.split(":domain:")[0] === activeAttack.squadId.split(":domain:")[0] &&
          squad.objectiveId === activeAttack.objectiveId &&
          !["completed", "cancelled"].includes(squad.state)
      )
    : [];
  const missionMembers = new Set(missionSquads.flatMap((squad) => squad.actorIds));
  const missionProgressing =
    activeAttack?.lifecycle?.lastUsefulEffectTick != null &&
    activeAttack.lifecycle.effectDeadline.dueTick > context.observation.tick;
  const committedAttackers = new Set(
    context.combat
      .filter((actor) => {
        const order = actor.activeOrder?.status === "known" ? actor.activeOrder.value : null;
        return (
          liveTarget &&
          missionMembers.has(actor.actorId) &&
          (missionProgressing ||
            (order?.orderType === OrderType.Attack &&
              (order.targetActorId === liveTarget.actorId || order.targetActorId === null)))
        );
      })
      .map((actor) => actor.actorId)
  );
  appendReserve(context, committedAttackers);
  const activeFrontierScoutIds = new Set(
    context.activeScout?.objectiveId?.startsWith("question:") ||
      (context.activeScout?.objectiveId?.startsWith("neutral:") && context.activeScout.state === "moving")
      ? context.activeScout.actorIds
      : []
  );
  const attackers = context.combat.filter(
    (actor) => !context.primaryOwnedActors.has(actor.actorId) && !activeFrontierScoutIds.has(actor.actorId)
  );
  const choice = selectAiOffensiveOpportunity(context, attackers);
  context.opponent = choice.opponent;
  context.assessment = choice.assessment;
  const attackId = context.activeAttack?.squadId ?? ("squad:attack:primary" as AiSquadId);
  context.attackPlanId = `plan:${attackId}` as AiPlanId;
  if (choice.assessment.reason === "route_pending" && activeAttack && liveTarget && committedAttackers.size > 0) {
    // A rebuilding advisory graph cannot invalidate a native attack still working on its observed target.
    const available = new Set(attackers.map((actor) => actor.actorId));
    context.nextSquads.push(
      ...missionSquads
        .map((squad) => ({ ...squad, actorIds: squad.actorIds.filter((actorId) => available.has(actorId)) }))
        .filter((squad) => squad.actorIds.length > 0)
    );
    context.opponent = liveTarget;
    context.assessment = { ...choice.assessment, targetActorId: liveTarget.actorId };
    return undefined;
  }
  if (!context.opponent || choice.attackers.length === 0) return undefined;
  const sourceNode = node(choice.attackers[0]);
  const targetNode = node(context.opponent);
  const route = choice.route;
  if (choice.assessment.choice === "recover" || choice.assessment.choice === "scout") return undefined;
  const attack = createAttackSquad(context, context.opponent, choice.attackers, route, sourceNode);
  const targetPosition = position(context.opponent);
  const rememberedCore =
    context.opponent.visibility === "last_seen" &&
    context.opponent.mainBuilding?.status === "known" &&
    context.opponent.mainBuilding.value;
  const coreScoutObjective = `core:${context.opponent.evidenceId}`;
  const existingScout = context.activeScout;
  const continuingCoreScout = existingScout?.objectiveId === coreScoutObjective;
  const scoutActor =
    rememberedCore && attack.state === "forming"
      ? (choice.attackers.find((actor) => continuingCoreScout && existingScout.actorIds.includes(actor.actorId)) ??
        choice.attackers.find((actor) => domains(actor).includes("air")) ??
        choice.attackers[0])
      : undefined;
  const coreScout = scoutActor
    ? {
        squadId: (continuingCoreScout ? existingScout?.squadId : "squad:scout:core") as AiSquadId,
        role: "scout" as const,
        domain: domains(scoutActor).includes("air")
          ? ("air" as const)
          : domains(scoutActor).includes("water")
            ? ("water" as const)
            : ("ground" as const),
        actorIds: [scoutActor.actorId],
        objectiveId: coreScoutObjective,
        state: "moving" as const,
        lifecycle: {
          targetPlayerNumber: null,
          targetRegionId: route?.destinationNodeId ?? null,
          protectedBaseId: context.state.bases.find((base) => base.active)?.baseId ?? "base:home",
          rallyNodeId: node(scoutActor) ?? null,
          retreatNodeId: context.homeAccess ?? null,
          createdTick: continuingCoreScout
            ? (existingScout?.lifecycle?.createdTick ?? context.observation.tick)
            : context.observation.tick,
          assemblyDeadline: continuingCoreScout
            ? (existingScout?.lifecycle?.assemblyDeadline ?? aiDeadline(context.observation.tick + 200))
            : aiDeadline(context.observation.tick + 200),
          effectDeadline: continuingCoreScout
            ? (existingScout?.lifecycle?.effectDeadline ?? aiDeadline(context.observation.tick + 2400))
            : aiDeadline(context.observation.tick + 2400),
          lastUsefulEffectTick: continuingCoreScout ? (existingScout?.lifecycle?.lastUsefulEffectTick ?? null) : null,
          recoveryAttempt: continuingCoreScout ? (existingScout?.lifecycle?.recoveryAttempt ?? 0) : 0,
          terminalReason: null
        },
        ...(continuingCoreScout && existingScout?.tactics ? { tactics: existingScout.tactics } : {})
      }
    : undefined;
  context.nextSquads.push(
    ...(coreScout
      ? [{ ...attack, actorIds: attack.actorIds.filter((actorId) => actorId !== scoutActor?.actorId) }]
      : [attack])
  );
  if (coreScout && scoutActor && targetPosition) {
    context.primaryOwnedActors.add(scoutActor.actorId);
    context.nextSquads.push(coreScout);
    if (!continuingCoreScout || !coreScout.tactics)
      context.intents.push({
        ...intentBase(
          context.state,
          `plan:${coreScout.squadId}` as AiPlanId,
          context.observation.tick,
          `core:${context.opponent.evidenceId}`,
          "scouting",
          650
        ),
        kind: "scout",
        actorIds: coreScout.actorIds,
        logicalPosition: targetPosition,
        claims: coreScout.actorIds.map((actorId) => ({
          claimId: `claim:core-scout:${actorId}` as const,
          kind: "actor" as const,
          actorId
        }))
      });
    context.skirmish = withTimeline(
      context.skirmish,
      context.observation.tick,
      "mission",
      coreScout.squadId,
      `core_scout:${context.opponent.evidenceId}`
    );
  }
  if ((route?.kind === "water_transport" || route?.kind === "air_transport") && sourceNode && targetNode)
    return transportProposal(context, attack, choice.attackers, route, sourceNode, targetNode);
  const launchRecorded = context.state.skirmish.timeline.some(
    (event) =>
      event.kind === "mission" &&
      event.subjectId.split(":domain:")[0] === attackId.split(":domain:")[0] &&
      event.detail.startsWith("launch:") &&
      event.tick >= (attack.lifecycle?.createdTick ?? context.observation.tick)
  );
  if (
    !launchRecorded &&
    attack.state === "moving" &&
    route &&
    context.state.squads.filter((squad) => squad.role === "attack" && squad.state !== "completed").length <
      profile.voluntaryOffensiveMissionLimit + 1
  ) {
    if (context.opponent.visibility === "visible" && canTarget(choice.attackers[0]!, context.opponent)) {
      const opponent = context.opponent;
      const directAttack = choice.attackers.every((actor) => canSeeTarget(actor, opponent, context.catalog));
      const approach = targetPosition
        ? (selectAiAttackApproachPositions(
            choice.attackers,
            targetPosition,
            context.observation,
            targetFootprintRadiusTiles(opponent, context.catalog)
          )[0]?.position ??
          context.observation.map?.accessGraph?.nodes.find((region) => region.nodeId === targetNode)
            ?.representativePosition)
        : undefined;
      if (!directAttack && !approach) return undefined;
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
        claims: actorClaims(attack.actorIds),
        targetActorId: directAttack ? context.opponent.actorId : null,
        targetPosition: directAttack ? null : (approach ?? null)
      });
    } else if (targetPosition)
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
        claims: actorClaims(attack.actorIds),
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
