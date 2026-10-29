import type { AiManagerProposalV1 } from "./ai-manager-proposal";
import { OrderType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import type { AiProfileConfigV1 } from "../contracts/ai-profile-config-v1";
import { aiDeadline, type AiClaimId, type AiPlanId, type AiSquadId } from "../contracts/ai-core-types";
import type { AiSquadStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiStrategyAssessment } from "../contracts/ai-strategy-assessment";
import { queryAiAccessRouteV1 } from "./ai-access-graph-v1";
import type { AiRouteResultV1 } from "../contracts/ai-access-graph-v1";
import type { AiSkirmishProposalContext } from "./ai-skirmish-proposal-context";
import { createAiTransportPlanV1 } from "./ai-transport-manager";
import { AI_SKIRMISH_ASSEMBLY_TIMEOUT_TICKS } from "./ai-skirmish-defense";
import { selectAiNavalShoreFiringPosition } from "./select-ai-offensive-force";
import { selectAiOffensiveOpportunity } from "./select-ai-offensive-opportunity";
import { retainAiSquadTacticsForActors } from "./ai-skirmish-tactics-ownership";
import { canSeeTarget } from "./ai-tactics-combat";
import { selectAiAttackApproachPositions, targetFootprintRadiusTiles } from "./ai-tactics-approach-positions";
import {
  canTarget,
  distance,
  domains,
  intentBase,
  node,
  position,
  regionId,
  routeCapability,
  withTimeline
} from "./ai-skirmish-support";

function retainSquadTacticsForActors(squad: AiSquadStateV1, actorIds: readonly string[]): AiSquadStateV1 {
  return {
    ...squad,
    actorIds: [...actorIds],
    ...(squad.tactics ? { tactics: retainAiSquadTacticsForActors(squad.tactics, actorIds) } : {})
  };
}

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

function hasEconomicRaidValue(actor: AiSkirmishProposalContext["visibleEnemies"][number]): boolean {
  return actor.capabilities.some((capability) => ["gather", "drop_off", "produce"].includes(capability.family));
}

function hasNearbyEnemyProducer(
  context: AiSkirmishProposalContext,
  target: AiSkirmishProposalContext["visibleEnemies"][number]
): boolean {
  const targetPosition = position(target);
  return (
    targetPosition !== undefined &&
    context.visibleEnemies.some((enemy) => {
      const enemyPosition = position(enemy);
      return (
        enemy.actorId !== target.actorId &&
        enemyPosition !== undefined &&
        distance(targetPosition, enemyPosition) <= 18 &&
        enemy.capabilities.some((capability) => capability.family === "produce")
      );
    })
  );
}

function canFireAtTargetFromCurrentPosition(
  attacker: AiSkirmishProposalContext["combat"][number],
  target: AiSkirmishProposalContext["visibleEnemies"][number],
  context: AiSkirmishProposalContext
): boolean {
  const attackerPosition = position(attacker);
  const targetPosition = position(target);
  const attacks = attacker.combatProfile?.status === "known" ? attacker.combatProfile.value.attacks : [];
  if (!attackerPosition || !targetPosition) return false;
  const targetDomains = domains(target);
  const separation = distance(attackerPosition, targetPosition);
  const footprint = targetFootprintRadiusTiles(target, context.catalog);
  return attacks.some(
    (attack) =>
      attack.damage > 0 &&
      targetDomains.some((targetDomain) => attack.targetDomains.includes(targetDomain)) &&
      separation >= attack.minRange &&
      separation <=
        attack.range + (attackerPosition.z > targetPosition.z ? attack.highGroundRangeBonus : 0) + footprint
  );
}

function isMovingTo(actor: AiSkirmishProposalContext["combat"][number], target: NonNullable<ReturnType<typeof position>>): boolean {
  const order = actor.activeOrder?.status === "known" ? actor.activeOrder.value : null;
  return order?.orderType === OrderType.Move && !!order.targetPosition && distance(order.targetPosition, target) <= 1;
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
  sourceNode: ReturnType<typeof node>,
  mission?: {
    readonly squadId?: AiSquadId;
    readonly existing?: AiSquadStateV1;
    readonly assessment?: AiStrategyAssessment;
  }
): AiSquadStateV1 {
  const activeAttack = mission?.existing ?? (mission?.squadId ? undefined : context.activeAttack);
  const assessment = mission?.assessment ?? context.assessment;
  const assemblyExpired =
    activeAttack?.lifecycle?.assemblyDeadline.dueTick !== undefined &&
    activeAttack.lifecycle.assemblyDeadline.dueTick <= context.observation.tick;
  const fullEngagement = (assessment?.readyForce ?? 0) >= (assessment?.requiredForce ?? 2);
  const severeCounterforce = (assessment?.visibleThreatCount ?? 0) >= Math.max(3, (assessment?.readyForce ?? 0) * 2);
  const requiredForce = assessment?.requiredForce ?? 2;
  const minimumTimedForce = requiredForce <= 3 ? 1 : Math.ceil(requiredForce * 0.75);
  const timedEngagement =
    assemblyExpired &&
    !severeCounterforce &&
    (assessment?.readyForce ?? 0) > (assessment?.visibleThreatCount ?? 0) &&
    requiredForce <= 5 &&
    route?.kind === "direct" &&
    route.domain === "ground" &&
    (assessment?.readyForce ?? 0) >= minimumTimedForce;
  const isReachable = route?.kind === "direct" || route?.kind === "air_or_naval_objective";
  const attackState: AiSquadStateV1["state"] =
    isReachable && assessment?.choice !== "recover" && (fullEngagement || timedEngagement) ? "moving" : "forming";
  const attackId = mission?.squadId ?? activeAttack?.squadId ?? ("squad:attack:primary" as AiSquadId);
  context.attackPlanId = `plan:${attackId}` as AiPlanId;
  const actorIds = attackers.map((actor) => actor.actorId);
  const previousTactics = activeAttack?.tactics;
  const attack: AiSquadStateV1 = {
    squadId: attackId,
    role: "attack",
    domain: domains(attackers[0]!).includes("air")
      ? "air"
      : domains(attackers[0]!).includes("water")
        ? "water"
        : "ground",
    actorIds,
    objectiveId: opponent.visibility === "visible" ? opponent.actorId : `hypothesis:${opponent.evidenceId}`,
    state: attackState,
    lifecycle: {
      targetPlayerNumber: activeAttack?.lifecycle?.targetPlayerNumber ?? opponent.owner,
      targetRegionId: activeAttack?.lifecycle?.targetRegionId ?? regionId(opponent),
      protectedBaseId: null,
      rallyNodeId: sourceNode ?? null,
      retreatNodeId: context.homeAccess ?? null,
      createdTick: activeAttack?.lifecycle?.createdTick ?? context.observation.tick,
      assemblyDeadline:
        activeAttack?.lifecycle?.assemblyDeadline ??
        aiDeadline(context.observation.tick + AI_SKIRMISH_ASSEMBLY_TIMEOUT_TICKS),
      effectDeadline: activeAttack?.lifecycle?.effectDeadline ?? aiDeadline(context.observation.tick + 2400),
      lastUsefulEffectTick: activeAttack?.lifecycle?.lastUsefulEffectTick ?? null,
      recoveryAttempt: activeAttack?.lifecycle?.recoveryAttempt ?? 0,
      terminalReason: route?.kind === "impossible" ? route.reason : null
    },
    ...(previousTactics ? { tactics: previousTactics } : {})
  };
  return retainSquadTacticsForActors(attack, actorIds);
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
  const activeRaidSquads = context.state.squads.filter(
    (squad) =>
      squad.role === "attack" &&
      squad.squadId.startsWith("squad:attack:raid:") &&
      !["completed", "cancelled"].includes(squad.state)
  );
  const activeRaidMembers = new Set(activeRaidSquads.flatMap((squad) => squad.actorIds));
  const missionProgressing =
    activeAttack?.lifecycle?.lastUsefulEffectTick != null &&
    activeAttack.lifecycle.effectDeadline.dueTick > context.observation.tick;
  const committedAttackers = new Set([
    ...activeRaidMembers,
    ...context.combat
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
  ]);
  appendReserve(context, committedAttackers);
  context.nextSquads.push(...activeRaidSquads);
  activeRaidMembers.forEach((actorId) => context.primaryOwnedActors.add(actorId));
  const activeMissionCount = context.state.squads.filter(
    (squad) => squad.role === "attack" && !["completed", "cancelled"].includes(squad.state)
  ).length;
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
        .map((squad) =>
          retainSquadTacticsForActors(
            squad,
            squad.actorIds.filter((actorId) => available.has(actorId))
          )
        )
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
  let primaryAttackers = [...choice.attackers];
  let attack = createAttackSquad(context, context.opponent, primaryAttackers, route, sourceNode);
  const reserveSquad = context.nextSquads.find((squad) => squad.role === "reserve");
  const reserveActors = reserveSquad
    ? context.combat.filter((actor) => reserveSquad.actorIds.includes(actor.actorId))
    : [];
  const primaryMinimum = Math.max(choice.assessment.requiredForce, Math.ceil(primaryAttackers.length * 0.6));
  const surplusCount = Math.max(0, Math.min(4, primaryAttackers.length - primaryMinimum));
  const surplusActors =
    surplusCount > 0 ? primaryAttackers.filter((actor) => !missionMembers.has(actor.actorId)).slice(-surplusCount) : [];
  const primaryAttackerIds = new Set(primaryAttackers.map((actor) => actor.actorId));
  const navalRaidCandidates = attackers.filter(
    (actor) => domains(actor).includes("water") && !primaryAttackerIds.has(actor.actorId)
  );
  const raidCandidates = [...reserveActors, ...surplusActors, ...navalRaidCandidates];
  const primaryMissionCount = activeMissionCount + (context.activeAttack ? 0 : 1);
  const raidTargetContext = {
    ...context,
    activeAttack: undefined,
    rememberedEnemies: []
  };
  const navalRaidTargetContext = {
    ...raidTargetContext,
    rememberedEnemies: context.opponent ? [context.opponent] : []
  };
  const raidSelectionEnabled =
    attack.state === "moving" &&
    (!context.localThreat ||
      context.nextSquads.some((squad) => squad.role === "defense" && squad.actorIds.length > 0)) &&
    activeRaidSquads.length === 0 &&
    raidCandidates.length > 0 &&
    primaryMissionCount < profile.voluntaryOffensiveMissionLimit + 1;
  const chooseRaid = (candidates: typeof raidCandidates) =>
    selectAiOffensiveOpportunity(raidTargetContext, candidates, {
      raid: true,
      candidateFilter: (actor) =>
        actor.actorId !== context.opponent?.actorId &&
        hasEconomicRaidValue(actor) &&
        !(
          actor.capabilities.some((capability) => capability.family === "produce") &&
          hasNearbyEnemyProducer(context, actor)
        )
    });
  type RaidChoice = ReturnType<typeof chooseRaid>;
  type MaybeRaidChoice = RaidChoice | undefined;
  type ExecutableRaidRoute = Extract<AiRouteResultV1, { readonly kind: "direct" | "air_or_naval_objective" }>;
  const canLaunchRaid = (choice: MaybeRaidChoice): choice is RaidChoice & { readonly route: ExecutableRaidRoute } => {
    const route = choice?.route;
    return (
      choice !== undefined &&
      choice.assessment.choice !== "recover" &&
      choice.assessment.choice !== "scout" &&
      (route?.kind === "direct" || (route?.kind === "air_or_naval_objective" && route.domain === "water")) &&
      choice.assessment.requiredForce <= 4 &&
      choice.assessment.readyForce >= choice.assessment.requiredForce
    );
  };
  const reserveChoice = raidSelectionEnabled && reserveActors.length > 0 ? chooseRaid(reserveActors) : undefined;
  const navalChoice =
    raidSelectionEnabled && navalRaidCandidates.length > 0
      ? selectAiOffensiveOpportunity(navalRaidTargetContext, navalRaidCandidates, {
          raid: true,
          candidateFilter: (actor) =>
            actor.actorId === context.opponent?.actorId ||
            (hasEconomicRaidValue(actor) &&
              !(
                actor.capabilities.some((capability) => capability.family === "produce") &&
                hasNearbyEnemyProducer(context, actor)
              ))
        })
      : undefined;
  const preferredNavalChoice =
    canLaunchRaid(navalChoice) && navalChoice.route.domain === "water" ? navalChoice : undefined;
  const preferredReserveChoice = canLaunchRaid(reserveChoice) ? reserveChoice : undefined;
  const raidChoiceCandidate =
    preferredNavalChoice ?? preferredReserveChoice ?? (raidSelectionEnabled ? chooseRaid(raidCandidates) : undefined);
  const raidChoice = canLaunchRaid(raidChoiceCandidate) ? raidChoiceCandidate : undefined;
  const raidAttackers = raidChoice?.attackers.slice(0, Math.min(4, raidChoice.assessment.readyForce)) ?? [];
  const raidTarget = raidAttackers.length >= 1 ? raidChoice?.opponent : undefined;
  const raidSourceNode = raidAttackers.length > 0 ? node(raidAttackers[0]!) : undefined;
  const raidSquad =
    raidTarget && raidChoice?.route && raidSourceNode
      ? createAttackSquad(
          { ...context, activeAttack: undefined, assessment: raidChoice.assessment },
          raidTarget,
          raidAttackers,
          raidChoice.route,
          raidSourceNode,
          { squadId: `squad:attack:raid:${raidTarget.actorId}` as AiSquadId, assessment: raidChoice.assessment }
        )
      : undefined;
  if (raidSquad) {
    const raidIds = new Set(raidSquad.actorIds);
    primaryAttackers = primaryAttackers.filter((actor) => !raidIds.has(actor.actorId));
    attack = createAttackSquad(context, context.opponent, primaryAttackers, route, sourceNode);
    raidSquad.actorIds.forEach((actorId) => context.primaryOwnedActors.add(actorId));
  }
  context.attackPlanId = `plan:${attack.squadId}` as AiPlanId;
  if (raidSquad && reserveSquad) {
    const retainedReserveIds = reserveSquad.actorIds.filter((actorId) => !raidSquad.actorIds.includes(actorId));
    const reserveIndex = context.nextSquads.indexOf(reserveSquad);
    if (retainedReserveIds.length > 0)
      context.nextSquads[reserveIndex] = retainSquadTacticsForActors(reserveSquad, retainedReserveIds);
    else context.nextSquads.splice(reserveIndex, 1);
  }
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
      ? (primaryAttackers.find((actor) => continuingCoreScout && existingScout.actorIds.includes(actor.actorId)) ??
        primaryAttackers.find((actor) => domains(actor).includes("air")) ??
        primaryAttackers[0])
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
      : [attack]),
    ...(raidSquad ? [raidSquad] : [])
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
    return transportProposal(context, attack, primaryAttackers, route, sourceNode, targetNode);
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
    if (context.opponent.visibility === "visible" && canTarget(primaryAttackers[0]!, context.opponent)) {
      const opponent = context.opponent;
      const directAttack = primaryAttackers.every(
        (actor) =>
          canSeeTarget(actor, opponent, context.catalog) &&
          (!domains(actor).includes("water") || canFireAtTargetFromCurrentPosition(actor, opponent, context))
      );
      const firingNodeId = route.kind === "air_or_naval_objective" ? route.firingNodeId :
        route.kind === "direct" ? route.firingNodeId ?? route.destinationNodeId : undefined;
      const navalApproach =
        ((route.kind === "air_or_naval_objective" && route.domain === "water") ||
          (route.kind === "direct" && route.domain === "water")) &&
        firingNodeId
        ? selectAiNavalShoreFiringPosition(context, opponent, firingNodeId)
        : undefined;
      const approach = navalApproach ?? (targetPosition
        ? (selectAiAttackApproachPositions(
            primaryAttackers,
            targetPosition,
            context.observation,
            targetFootprintRadiusTiles(opponent, context.catalog)
          )[0]?.position ??
          context.observation.map?.accessGraph?.nodes.find((region) => region.nodeId === targetNode)
            ?.representativePosition)
        : undefined);
      if (!directAttack && !approach) return undefined;
      const needsNavalAdvance =
        navalApproach !== undefined &&
        primaryAttackers.some(
          (actor) => domains(actor).includes("water") && !canFireAtTargetFromCurrentPosition(actor, opponent, context)
        );
      if (needsNavalAdvance && navalApproach) {
        const actorIds = primaryAttackers.filter((actor) => !isMovingTo(actor, navalApproach)).map((actor) => actor.actorId);
        if (actorIds.length > 0)
          context.intents.push({
            ...intentBase(
              context.state,
              context.attackPlanId,
              context.observation.tick,
              `approach:${context.opponent.actorId}`,
              "army_threat",
              760
            ),
            kind: "move",
            actorIds,
            claims: actorClaims(actorIds),
            logicalPosition: navalApproach
          });
      } else {
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
        context.skirmish = withTimeline(
          context.skirmish,
          context.observation.tick,
          "mission",
          attackId,
          `launch:${route.kind}`
        );
      }
    } else if (targetPosition) {
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
  }
  if (raidSquad && raidTarget && raidChoice && raidSquad.state === "moving") {
    const raidId = raidSquad.squadId;
    const raidPlanId = `plan:${raidId}` as AiPlanId;
    const raidTargetPosition = position(raidTarget);
    const raidLaunchRecorded = context.state.skirmish.timeline.some(
      (event) => event.kind === "mission" && event.subjectId === raidId && event.detail.startsWith("launch:")
    );
    if (!raidLaunchRecorded && canTarget(raidAttackers[0]!, raidTarget)) {
      const directRaidAttack =
        raidTarget.visibility === "visible" &&
        raidAttackers.every(
          (actor) =>
            canSeeTarget(actor, raidTarget, context.catalog) &&
            (!domains(actor).includes("water") || canFireAtTargetFromCurrentPosition(actor, raidTarget, context))
        );
      const firingNodeId =
        raidChoice.route.kind === "air_or_naval_objective"
          ? raidChoice.route.firingNodeId
          : raidChoice.route.destinationNodeId;
      const navalFiringPosition =
        raidChoice.route.domain === "water"
          ? selectAiNavalShoreFiringPosition(context, raidTarget, firingNodeId)
          : undefined;
      const raidApproach =
        navalFiringPosition ??
        (raidTargetPosition
          ? (selectAiAttackApproachPositions(
              raidAttackers,
              raidTargetPosition,
              context.observation,
              targetFootprintRadiusTiles(raidTarget, context.catalog)
            )[0]?.position ??
            context.observation.map?.accessGraph?.nodes.find((candidate) => candidate.nodeId === node(raidTarget))
              ?.representativePosition)
          : undefined);
      if (directRaidAttack || raidApproach) {
        const needsNavalAdvance =
          navalFiringPosition !== undefined &&
          raidAttackers.some(
            (actor) => domains(actor).includes("water") && !canFireAtTargetFromCurrentPosition(actor, raidTarget, context)
          );
        if (needsNavalAdvance && navalFiringPosition) {
          const actorIds = raidAttackers.filter((actor) => !isMovingTo(actor, navalFiringPosition)).map((actor) => actor.actorId);
          if (actorIds.length > 0)
            context.intents.push({
              ...intentBase(
                context.state,
                raidPlanId,
                context.observation.tick,
                `approach:${raidTarget.actorId}`,
                "army_threat",
                750
              ),
              kind: "move",
              actorIds,
              claims: actorClaims(actorIds),
              logicalPosition: navalFiringPosition
            });
        } else {
          context.intents.push({
            ...intentBase(
              context.state,
              raidPlanId,
              context.observation.tick,
              `raid:${raidTarget.actorId}`,
              "army_threat",
              750
            ),
            kind: "attack",
            actorIds: raidSquad.actorIds,
            claims: actorClaims(raidSquad.actorIds),
            targetActorId: directRaidAttack ? raidTarget.actorId : null,
            targetPosition: directRaidAttack ? null : (raidApproach ?? null)
          });
          context.skirmish = withTimeline(
            context.skirmish,
            context.observation.tick,
            "mission",
            raidId,
            `launch:${raidChoice.route.kind}`
          );
        }
      }
    }
  }
  return undefined;
}
