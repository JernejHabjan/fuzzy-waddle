import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import type { AiSquadStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiObservedActorV1 } from "../contracts/ai-observation-v1";
import { knownPosition, distance, legalForMembers, safeRetreatPosition } from "./ai-tactics-geometry";
import { canTarget, canSeeTarget, isEconomicActor, estimateAiEngagementV1, objectiveScore } from "./ai-tactics-combat";
import {
  AI_TACTICS_TARGET_SWITCH_IMPROVEMENT_PERMILLE,
  MAX_LOCAL_ENEMIES,
  MAX_OBJECTIVE_ALTERNATIVES,
  MAX_STRATEGIC_CONTACTS,
  STALE_OBJECTIVE_TICKS
} from "./ai-tactics-rules";

import type { AiTacticsContext } from "./ai-tactics-context";
import { canPursueAiTacticalObjective } from "./ai-tactics-objective-eligibility";

function isCredibleThreatToMembers(enemy: AiObservedActorV1, members: readonly AiObservedActorV1[]): boolean {
  const enemyProfile = enemy.combatProfile;
  if (enemyProfile?.status !== "known") return true;
  return members.some((member) => {
    const memberProfile = member.combatProfile;
    if (memberProfile?.status !== "known") return true;
    const maxHealth = Math.max(
      1,
      (memberProfile.value.maxHealth * (member.healthPermille?.status === "known" ? member.healthPermille.value : 1000)) /
        1000
    );
    // Treat an attacker as relevant when it could remove a quarter of this member's health in 20 seconds.
    return enemyProfile.value.attacks.some(
      (attack) =>
        attack.damage > 0 &&
        attack.targetDomains.some((domain) =>
          member.capabilities.some((capability) => capability.domains.includes(domain))
        ) &&
        (attack.damage * 400) / Math.max(1, attack.cooldownTicks) >= maxHealth / 4
    );
  });
}

/** Prepares current members and permitted combat facts. */
export function prepareAiTacticalSquad(context: AiTacticsContext, squad: AiSquadStateV1) {
  const { actorById, catalog, claimedActors, observation, profile, state, transportOwned, updates, visibleEnemies } =
    context;
  const hypothesisEvidenceId = squad.objectiveId?.startsWith("hypothesis:")
    ? squad.objectiveId.slice("hypothesis:".length)
    : undefined;
  const objectiveActor = squad.objectiveId
    ? (actorById.get(squad.objectiveId as ActorId) ??
      (hypothesisEvidenceId
        ? observation.actors.find((actor) => actor.evidenceId === hypothesisEvidenceId)
        : undefined))
    : undefined;
  const objectiveObservedTick =
    objectiveActor?.logicalPosition.status === "known"
      ? objectiveActor.logicalPosition.observedTick
      : objectiveActor?.observedTick;
  if (
    squad.role === "attack" &&
    squad.objectiveId !== null &&
    ((!squad.objectiveId.startsWith("hypothesis:") &&
      objectiveActor === undefined &&
      visibleEnemies.length === 0 &&
      observation.tick -
        (objectiveObservedTick ??
          squad.lifecycle?.lastUsefulEffectTick ??
          squad.lifecycle?.createdTick ??
          observation.tick) >
        STALE_OBJECTIVE_TICKS) ||
      (objectiveActor?.visibility === "last_seen" &&
        objectiveObservedTick !== undefined &&
        observation.tick - objectiveObservedTick > STALE_OBJECTIVE_TICKS))
  ) {
    updates.push({
      ...squad,
      actorIds: [],
      state: "completed",
      ...(squad.lifecycle ? { lifecycle: { ...squad.lifecycle, terminalReason: "stale_contact_released" } } : {})
    });
    return null;
  }
  const members = squad.actorIds
    .filter((actorId) => !claimedActors.has(actorId) && !transportOwned.has(actorId))
    .map((actorId) => actorById.get(actorId))
    .filter(
      (actor): actor is AiObservedActorV1 =>
        actor !== undefined &&
        actor.relation === "self" &&
        actor.containedInActorId == null &&
        !isEconomicActor(actor, catalog)
    )
    .sort((left, right) => left.actorId.localeCompare(right.actorId));
  members.forEach((actor) => claimedActors.add(actor.actorId));
  const origin = knownPosition(members[0]);
  const nearbyEnemies = visibleEnemies
    .filter((enemy) => !origin || distance(origin, knownPosition(enemy)!) <= 18)
    .slice(0, MAX_LOCAL_ENEMIES);
  // Recon units keep searching through harmless contacts; only a credible attacker should interrupt scouting.
  const localEnemies = squad.role === "scout"
    ? nearbyEnemies.filter((enemy) => isCredibleThreatToMembers(enemy, members))
    : nearbyEnemies;
  const sourceNodeId = members[0]?.accessNodeId.status === "known" ? members[0].accessNodeId.value : null;
  const alternatives = visibleEnemies
    .slice(0, MAX_STRATEGIC_CONTACTS)
    .filter((enemy) => canPursueAiTacticalObjective(members, enemy, observation))
    .map((enemy) => {
      const targetNodeId = enemy.accessNodeId.status === "known" ? enemy.accessNodeId.value : null;
      const routeStatus =
        sourceNodeId && targetNodeId
          ? (observation.accessProducts.find(
              (product) => product.fromNodeId === sourceNodeId && product.toNodeId === targetNodeId
            )?.status ?? "not_recorded")
          : "not_recorded";
      return {
        objectiveId: enemy.actorId,
        score: objectiveScore(enemy, origin, routeStatus),
        reason: `visible_value_route_${routeStatus}`
      };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score || left.objectiveId.localeCompare(right.objectiveId))
    .slice(0, MAX_OBJECTIVE_ALTERNATIVES);
  const previousTarget = squad.tactics?.targetActorId ? actorById.get(squad.tactics.targetActorId) : undefined;
  const bestTarget = alternatives[0];
  const rememberedTarget = objectiveActor;
  const committedTarget =
    ["attack", "defense"].includes(squad.role) &&
    rememberedTarget?.relation === "enemy" &&
    (rememberedTarget.visibility === "visible" ||
      (squad.role === "attack" &&
        rememberedTarget.visibility === "last_seen" &&
        rememberedTarget.mainBuilding?.status === "known" &&
        rememberedTarget.mainBuilding.value)) &&
    canPursueAiTacticalObjective(members, rememberedTarget, observation)
      ? rememberedTarget
      : undefined;
  const committedCoreObjective =
    squad.role === "attack" &&
    committedTarget?.mainBuilding?.status === "known" &&
    committedTarget.mainBuilding.value &&
    (committedTarget.visibility === "visible" || committedTarget.visibility === "last_seen");
  const immediateThreat =
    (squad.role === "scout" || (squad.role === "attack" && committedTarget && !committedCoreObjective)
      ? localEnemies
      : [])
    .filter(
      (enemy) =>
        canPursueAiTacticalObjective(members, enemy, observation) &&
        enemy.combatProfile?.status === "known" &&
        isCredibleThreatToMembers(enemy, members)
    )
    .flatMap((enemy) => {
      const enemyPosition = knownPosition(enemy);
      if (!enemyPosition) return [];
      const distances = members.flatMap((member) => {
        const memberPosition = knownPosition(member);
        return memberPosition && canTarget(member, enemy) && canTarget(enemy, member)
          ? [distance(memberPosition, enemyPosition)]
          : [];
      });
      return distances.length > 0 ? [{ enemy, nearest: Math.min(...distances) }] : [];
    })
    .filter(({ nearest }) => nearest <= 8)
    .sort(
      (left, right) => left.nearest - right.nearest || left.enemy.actorId.localeCompare(right.enemy.actorId)
    )[0]?.enemy;
  const retainPrevious = Boolean(
    previousTarget &&
      canPursueAiTacticalObjective(members, previousTarget, observation) &&
      previousTarget.visibility === "visible" &&
      squad.tactics &&
      bestTarget &&
      bestTarget.score * 1000 < squad.tactics.targetScore * (1000 + AI_TACTICS_TARGET_SWITCH_IMPROVEMENT_PERMILLE)
  );
  let targetId = immediateThreat?.actorId;
  if (!targetId && squad.role !== "scout") {
    if (committedTarget) targetId = committedTarget.actorId;
    else if (retainPrevious) targetId = previousTarget?.actorId;
    else if (bestTarget) targetId = bestTarget.objectiveId as ActorId;
    else if (canPursueAiTacticalObjective(members, rememberedTarget, observation)) targetId = rememberedTarget?.actorId;
  }
  const target = targetId ? actorById.get(targetId) : undefined;
  const visibleTarget = target?.visibility === "visible" ? target : undefined;
  const targetAwareMembers = visibleTarget
    ? members.filter((member) => canTarget(member, visibleTarget) && canSeeTarget(member, visibleTarget, catalog))
    : [];
  const engagementEnemies = visibleTarget
    ? [visibleTarget, ...localEnemies.filter((enemy) => enemy.actorId !== visibleTarget.actorId)]
    : localEnemies;
  const missionId = squad.squadId.split(":domain:")[0];
  const coordinatedIds = new Set(
    state.squads
      .filter(
        (other) =>
          other.squadId.split(":domain:")[0] === missionId &&
          other.objectiveId === squad.objectiveId &&
          !["completed", "cancelled"].includes(other.state)
      )
      .flatMap((other) => other.actorIds)
  );
  const coordinatedMembers = [...new Set([...members.map((member) => member.actorId), ...coordinatedIds])]
    .map((actorId) => actorById.get(actorId))
    .filter(
      (actor): actor is AiObservedActorV1 =>
        actor !== undefined &&
        actor.relation === "self" &&
        actor.containedInActorId == null &&
        !transportOwned.has(actor.actorId) &&
        !isEconomicActor(actor, catalog) &&
        (!origin || (knownPosition(actor) !== null && distance(origin, knownPosition(actor)!) <= 18))
    );
  const estimate = estimateAiEngagementV1(
    coordinatedMembers,
    engagementEnemies,
    profile.maxLocalEngagementPairsPerStep
  );
  const retainedRetreat =
    squad.role === "scout" &&
    ["retreat", "recover"].includes(squad.state)
      ? squad.tactics?.assignedPositions.find((assignment) => {
          const member = members.find((candidate) => candidate.actorId === assignment.actorId);
          return member && legalForMembers(assignment.position, observation, [member]);
        })?.position
      : undefined;
  const retreat = retainedRetreat ?? safeRetreatPosition(observation, state, members);
  return {
    ...context,
    squad,
    objectiveActor,
    objectiveObservedTick,
    members,
    origin,
    localEnemies,
    sourceNodeId,
    alternatives,
    previousTarget,
    bestTarget,
    rememberedTarget,
    committedTarget,
    immediateThreat,
    retainPrevious,
    targetId,
    target,
    visibleTarget,
    targetAwareMembers,
    estimate,
    retreat
  } as const;
}
