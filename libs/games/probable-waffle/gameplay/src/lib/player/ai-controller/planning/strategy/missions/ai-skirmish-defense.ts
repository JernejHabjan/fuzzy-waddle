import { type AiAccessNodeId, aiDeadline, type AiPlanId, type AiSquadId } from "../../../contracts/ai-core-types";
import { OrderType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiSquadState } from "../../../contracts/state/ai-state-contracts";
import type { AiProfileConfig } from "../../../contracts/ai-profile-config";
import type { AiIntent } from "../../../contracts/commands/ai-intent";
import type { AiSkirmishProposalContext } from "./ai-skirmish-proposal-context";
import { observedAiEconomyThreats } from "../../economy/service/ai-economy-policy";
import { queryAiAccessRoute } from "../../access/ai-access-graph";
import { canSeeTarget, estimateAiEngagement } from "../../tactics/combat/ai-tactics-combat";
import { AI_TACTICS_ATTACK_RATIO_PERMILLE } from "../../tactics/combat/ai-tactics-rules";
import { retainAiSquadTacticsForActors } from "../../tactics/orders/ai-skirmish-tactics-ownership";
import {
  baseId,
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

export const AI_SKIRMISH_ASSEMBLY_TIMEOUT_TICKS = 1200;
export const AI_PURSUIT_LEASH_TICKS = 200;

/** Keep a small, force-scaled guard at established remote bases without draining a small army. */
export function advanceAiExpansionSecurity(context: AiSkirmishProposalContext): void {
  const homeAnchorId = context.homeBaseActor?.actorId;
  const expansions = context.state.bases
    .filter((base) => base.active && base.anchorActorId && base.anchorActorId !== homeAnchorId && base.anchorPosition)
    .sort((left, right) => left.baseId.localeCompare(right.baseId));
  const desiredGuardCount = Math.min(expansions.length, Math.floor(context.combat.length / 8));
  const protectedActorIds = new Set(
    context.state.squads
      .filter(
        (squad) =>
          !squad.squadId.startsWith("squad:escort:expansion:") && !["completed", "cancelled"].includes(squad.state)
      )
      .flatMap((squad) => squad.actorIds)
  );
  const selectedGuardIds = new Set<string>();
  const graph = context.observation.map?.accessGraph;
  if (!graph) {
    for (const prior of context.state.squads.filter((squad) => squad.squadId.startsWith("squad:escort:expansion:")))
      context.nextSquads.push({ ...prior, actorIds: [], state: "completed" });
    return;
  }
  for (const base of expansions.slice(0, desiredGuardCount)) {
    const destinationNode = base.accessNodeId as AiAccessNodeId | null | undefined;
    if (!destinationNode) continue;
    const postPosition = context.observation.map?.tacticalCells
      ?.filter(
        (cell) =>
          cell.groundPassable &&
          !cell.observedBlocked &&
          cell.groundAccessNodeId === destinationNode &&
          distance(cell.position, base.anchorPosition!) > 0
      )
      .sort(
        (left, right) =>
          distance(left.position, base.anchorPosition!) - distance(right.position, base.anchorPosition!) ||
          left.tileKey.localeCompare(right.tileKey)
      )[0]?.position;
    if (!postPosition) continue;
    const squadId = `squad:escort:expansion:${base.baseId}` as AiSquadId;
    const prior = context.state.squads.find((squad) => squad.squadId === squadId);
    const eligible = context.combat
      .filter(
        (actor) =>
          !domains(actor).includes("air") &&
          !domains(actor).includes("water") &&
          !protectedActorIds.has(actor.actorId) &&
          !context.primaryOwnedActors.has(actor.actorId)
      )
      .flatMap((actor) => {
        const sourceNode = node(actor);
        const route = sourceNode
          ? queryAiAccessRoute(graph, {
              queryId: `query:expansion-guard:${base.baseId}:${actor.actorId}:${context.observation.generation}`,
              kind: "movement",
              fromNodeId: sourceNode,
              toNodeId: destinationNode,
              capabilities: routeCapability(context.observation, [actor], context.catalog),
              firingNodeIds: []
            })
          : undefined;
        return route?.kind === "direct"
          ? [{ actor, separation: distance(position(actor) ?? base.anchorPosition!, base.anchorPosition!) }]
          : [];
      })
      .sort(
        (left, right) => left.separation - right.separation || left.actor.actorId.localeCompare(right.actor.actorId)
      );
    const guard = eligible.find((entry) => entry.actor.actorId === prior?.actorIds[0]) ?? eligible[0];
    if (!guard) continue;
    selectedGuardIds.add(squadId);
    context.primaryOwnedActors.add(guard.actor.actorId);
    const guardPosition = position(guard.actor);
    const needsMove = !guardPosition || distance(guardPosition, postPosition) > 2;
    const activeOrder = guard.actor.activeOrder?.status === "known" ? guard.actor.activeOrder.value : null;
    const alreadyMovingToBase =
      activeOrder?.orderType === OrderType.Move &&
      !!activeOrder.targetPosition &&
      distance(activeOrder.targetPosition, postPosition) <= 1;
    if (needsMove && !alreadyMovingToBase)
      context.intents.push({
        ...intentBase(
          context.state,
          `plan:${squadId}` as AiPlanId,
          context.observation.tick,
          "guard-expansion",
          "army_threat",
          780
        ),
        kind: "move",
        actorIds: [guard.actor.actorId],
        claims: [
          {
            claimId: `claim:stage9:actor:${guard.actor.actorId}`,
            kind: "actor",
            actorId: guard.actor.actorId
          }
        ],
        logicalPosition: postPosition
      });
    context.nextSquads.push({
      squadId,
      role: "escort",
      domain: "ground",
      actorIds: [guard.actor.actorId],
      objectiveId: `expansion-guard:${base.baseId}`,
      state: needsMove ? "moving" : "defend",
      lifecycle: {
        targetPlayerNumber: null,
        targetRegionId: null,
        protectedBaseId: base.baseId,
        rallyNodeId: destinationNode,
        retreatNodeId: context.homeAccess ?? destinationNode,
        createdTick: prior?.lifecycle?.createdTick ?? context.observation.tick,
        assemblyDeadline:
          prior?.lifecycle?.assemblyDeadline ??
          aiDeadline(context.observation.tick + AI_SKIRMISH_ASSEMBLY_TIMEOUT_TICKS),
        effectDeadline: aiDeadline(context.observation.tick + 2400),
        lastUsefulEffectTick: prior?.lifecycle?.lastUsefulEffectTick ?? null,
        recoveryAttempt: 0,
        terminalReason: null
      }
    });
  }
  for (const prior of context.state.squads.filter(
    (squad) => squad.squadId.startsWith("squad:escort:expansion:") && !selectedGuardIds.has(squad.squadId)
  ))
    context.nextSquads.push({ ...prior, actorIds: [], state: "completed" });
}

export function advanceAiSkirmishDefense(context: AiSkirmishProposalContext, profile: AiProfileConfig): void {
  const { localThreat, combat, activeDefense, state, observation, homeAccess } = context;
  if (!localThreat || combat.length === 0) return;
  const threatOrderTarget =
    localThreat.activeOrder?.status === "known" ? localThreat.activeOrder.value?.targetActorId : undefined;
  const protectedActorIds = [
    context.homeBaseActor?.actorId,
    ...state.bases.filter((base) => base.active).flatMap((base) => [base.anchorActorId, ...base.memberActorIds])
  ];
  const threatPosition = position(localThreat);
  const nearbyProtectedAsset =
    threatPosition !== undefined &&
    [context.home, ...state.bases.filter((base) => base.active).map((base) => base.anchorPosition)]
      .filter((anchor): anchor is NonNullable<typeof anchor> => anchor != null)
      .some((anchor) => distance(anchor, threatPosition) <= 12);
  const attacksProtectedAsset =
    protectedActorIds.some((actorId) => actorId != null && actorId === threatOrderTarget) ||
    (localThreat.housingCost.status === "known" &&
      localThreat.housingCost.value > 0 &&
      (nearbyProtectedAsset ||
        observedAiEconomyThreats(observation).some((enemy) => enemy.actorId === localThreat.actorId)));
  const committedAttackers = new Set(
    !attacksProtectedAsset && context.activeAttack && !["completed", "cancelled"].includes(context.activeAttack.state)
      ? context.activeAttack.actorIds
      : []
  );
  let eligibleDefenders = combat.filter(
    (actor) => canTarget(actor, localThreat) && !committedAttackers.has(actor.actorId)
  );
  const withdrawingActors = new Set(
    state.squads
      .filter((squad) => !["completed", "cancelled"].includes(squad.state))
      .flatMap((squad) =>
        ["retreat", "retreating", "recover", "recovering"].includes(squad.state) &&
        squad.tactics?.script === "protected_retreat"
          ? squad.actorIds
          : (squad.tactics?.individualFallbackActorIds ?? [])
      )
  );
  const availableDefenders = eligibleDefenders.filter((actor) => {
    if (!withdrawingActors.has(actor.actorId)) return true;
    const order = actor.activeOrder?.status === "known" ? actor.activeOrder.value : null;
    const current = position(actor);
    return !(
      order?.orderType === OrderType.Move &&
      order.targetPosition &&
      current &&
      distance(current, order.targetPosition) > 1
    );
  });
  if (availableDefenders.length > 0) eligibleDefenders = availableDefenders;
  else {
    const fitDefenders = eligibleDefenders.filter(
      (actor) => actor.healthPermille?.status !== "known" || actor.healthPermille.value > 400
    );
    if (fitDefenders.length > 0) eligibleDefenders = fitDefenders;
  }
  const questionScoutActors = new Set(
    [
      ...context.state.squads,
      ...(context.activeScout && !context.state.squads.some((squad) => squad.squadId === context.activeScout?.squadId)
        ? [context.activeScout]
        : [])
    ]
      .filter(
        (squad) =>
          squad.role === "scout" &&
          !["completed", "cancelled"].includes(squad.state) &&
          (squad.objectiveId?.startsWith("question:") ||
            (squad.objectiveId?.startsWith("neutral:") && ["moving", "retreat"].includes(squad.state)))
      )
      .flatMap((squad) => squad.actorIds)
  );
  if (eligibleDefenders.length > 1 && questionScoutActors.size > 0) {
    eligibleDefenders = eligibleDefenders.filter((actor) => !questionScoutActors.has(actor.actorId));
  }
  if (eligibleDefenders.length === 0) return;
  const confirmedHome =
    context.homeBaseActor?.mainBuilding?.status === "known" && context.homeBaseActor.mainBuilding.value;
  const nearbyAttackers = context.visibleEnemies.filter((enemy) => {
    const enemyPosition = position(enemy);
    return (
      enemy.housingCost.status === "known" &&
      enemy.housingCost.value > 0 &&
      confirmedHome &&
      context.home !== undefined &&
      enemyPosition !== undefined &&
      distance(context.home, enemyPosition) <= 12
    );
  });
  const economyThreats = observedAiEconomyThreats(observation);
  // A two-to-one response can still arrive too slowly to save a nearby service under focused melee pressure.
  let defenseCount = Math.min(
    eligibleDefenders.length,
    Math.max(1, Math.ceil(eligibleDefenders.length * 0.25), Math.max(nearbyAttackers.length, economyThreats.length) * 3)
  );
  // A head-count reserve can remain too weak forever even while an idle army could remove the threat.
  while (defenseCount < Math.min(eligibleDefenders.length, profile.maxLocalEngagementPairsPerStep)) {
    const estimate = estimateAiEngagement(
      eligibleDefenders.slice(0, defenseCount),
      [localThreat],
      profile.maxLocalEngagementPairsPerStep
    );
    if (estimate.confidencePermille < 500 || estimate.ratioPermille >= AI_TACTICS_ATTACK_RATIO_PERMILLE) break;
    defenseCount++;
  }
  const defenders = eligibleDefenders.slice(0, defenseCount);
  defenders.forEach((actor) => context.primaryOwnedActors.add(actor.actorId));
  const targetPosition = position(localThreat);
  const targetedActorId =
    localThreat.activeOrder?.status === "known" ? localThreat.activeOrder.value?.targetActorId : undefined;
  const threatenedBase = state.bases
    .filter((base) => base.active && base.anchorPosition)
    .map((base) => ({
      base,
      directlyTargeted: targetedActorId === base.anchorActorId || base.memberActorIds.includes(targetedActorId ?? ""),
      distance: targetPosition ? distance(base.anchorPosition!, targetPosition) : Number.POSITIVE_INFINITY
    }))
    .filter(({ directlyTargeted, distance: separation }) => directlyTargeted || separation <= 12)
    .sort(
      (left, right) =>
        Number(right.directlyTargeted) - Number(left.directlyTargeted) ||
        left.distance - right.distance ||
        left.base.baseId.localeCompare(right.base.baseId)
    )[0]?.base;
  const defensePostNode = threatenedBase?.accessNodeId ?? homeAccess ?? null;
  const defenseId = activeDefense?.squadId ?? ("squad:defense:home" as AiSquadId);
  const defensePlanId = `plan:${defenseId}` as AiPlanId;
  const existingLifecycle = activeDefense?.lifecycle;
  const defense: AiSquadState = {
    squadId: defenseId,
    role: "defense",
    domain: domains(defenders[0] ?? combat[0]!).includes("air") ? "air" : "ground",
    actorIds: defenders.map((actor) => actor.actorId),
    objectiveId: localThreat.actorId,
    state: targetPosition ? "engaged" : "searching",
    ...(activeDefense?.tactics
      ? {
          tactics: retainAiSquadTacticsForActors(
            activeDefense.tactics,
            defenders.map((actor) => actor.actorId)
          )
        }
      : {}),
    lifecycle: {
      targetPlayerNumber: localThreat.owner,
      targetRegionId: regionId(localThreat),
      protectedBaseId: threatenedBase?.baseId ?? baseId(state),
      rallyNodeId: defensePostNode,
      retreatNodeId: defensePostNode,
      createdTick: existingLifecycle?.createdTick ?? observation.tick,
      assemblyDeadline:
        existingLifecycle?.assemblyDeadline ?? aiDeadline(observation.tick + AI_SKIRMISH_ASSEMBLY_TIMEOUT_TICKS),
      effectDeadline: aiDeadline(observation.tick + AI_PURSUIT_LEASH_TICKS),
      lastUsefulEffectTick: existingLifecycle?.lastUsefulEffectTick ?? null,
      recoveryAttempt: existingLifecycle?.recoveryAttempt ?? 0,
      terminalReason: null
    }
  };
  context.nextSquads.push(defense);
  const actorClaims = defense.actorIds.map((actorId) => ({
    claimId: `claim:stage9:actor:${actorId}` as AiIntent["claims"][number]["claimId"],
    kind: "actor" as const,
    actorId
  }));
  if (!activeDefense?.tactics && targetPosition) {
    // A visible offensive target can still be far from the base that this squad was recruited to defend.
    const homeThreats = [
      ...new Map([localThreat, ...nearbyAttackers, ...economyThreats].map((enemy) => [enemy.actorId, enemy])).values()
    ];
    const alreadyAttackingVisibleThreat = defenders.filter((actor) => {
      const activeOrder = actor.activeOrder?.status === "known" ? actor.activeOrder.value : null;
      return (
        activeOrder?.orderType === "Attack" &&
        homeThreats.some((enemy) => enemy.actorId === activeOrder.targetActorId && canTarget(actor, enemy))
      );
    });
    const armedThreats = homeThreats.filter((enemy) => {
      const activeOrder = enemy.activeOrder?.status === "known" ? enemy.activeOrder.value : null;
      return (
        activeOrder?.orderType === OrderType.Attack ||
        enemy.capabilities.some(
          (capability) => capability.family === "attack" && capability.targetDomains.length > 0
        ) ||
        (enemy.combatProfile?.status === "known" &&
          enemy.combatProfile.value.attacks.some((attack) => attack.damage > 0))
      );
    });
    const targetThreats = armedThreats.length > 0 ? armedThreats : [localThreat];
    let unassigned = defenders.filter((actor) => !alreadyAttackingVisibleThreat.includes(actor));
    targetThreats.forEach((threat, index) => {
      const candidates = unassigned.filter((actor) => canSeeTarget(actor, threat, context.catalog));
      if (candidates.length === 0) return;
      const remainingTargets = targetThreats
        .slice(index + 1)
        .filter((target) => unassigned.some((actor) => canSeeTarget(actor, target, context.catalog))).length;
      const allocationSize = Math.max(1, Math.ceil(candidates.length / (remainingTargets + 1)));
      const attackers = candidates.slice(0, allocationSize);
      context.intents.push({
        ...intentBase(state, defensePlanId, observation.tick, `defend:${threat.actorId}`, "army_threat", 940),
        kind: "attack",
        actorIds: attackers.map((actor) => actor.actorId),
        claims: actorClaims.filter((claim) => attackers.some((actor) => actor.actorId === claim.actorId)),
        targetActorId: threat.actorId,
        targetPosition: null
      });
      unassigned = unassigned.filter((actor) => !attackers.includes(actor));
    });
    if (unassigned.length > 0)
      context.intents.push({
        ...intentBase(state, defensePlanId, observation.tick, `intercept:${localThreat.actorId}`, "army_threat", 900),
        kind: "move",
        actorIds: unassigned.map((actor) => actor.actorId),
        claims: actorClaims.filter((claim) => unassigned.some((actor) => actor.actorId === claim.actorId)),
        logicalPosition: targetPosition
      });
  }
  context.skirmish = withTimeline(
    context.skirmish,
    observation.tick,
    "mission",
    defense.squadId,
    `defend:${localThreat.actorId}`
  );
}
