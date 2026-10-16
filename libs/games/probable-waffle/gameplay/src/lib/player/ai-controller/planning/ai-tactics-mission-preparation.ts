import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import type { AiSquadStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiObservedActorV1 } from "../contracts/ai-observation-v1";
import { knownPosition, distance, safeRetreatPosition } from "./ai-tactics-geometry";
import { canTarget, canSeeTarget, isEconomicActor, estimateAiEngagementV1, objectiveScore } from "./ai-tactics-combat";
import {
  AI_TACTICS_TARGET_SWITCH_IMPROVEMENT_PERMILLE,
  MAX_LOCAL_ENEMIES,
  MAX_OBJECTIVE_ALTERNATIVES,
  MAX_STRATEGIC_CONTACTS,
  STALE_OBJECTIVE_TICKS
} from "./ai-tactics-rules";

import type { AiTacticsContext } from "./ai-tactics-context";
/** Prepares current members and permitted combat facts. */
export function prepareAiTacticalSquad(context: AiTacticsContext, squad: AiSquadStateV1) {
  const { actorById, catalog, claimedActors, observation, profile, state, transportOwned, updates, visibleEnemies } =
    context;
  const objectiveActor = squad.objectiveId ? actorById.get(squad.objectiveId as ActorId) : undefined;
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
  const localEnemies = visibleEnemies
    .filter((enemy) => !origin || distance(origin, knownPosition(enemy)!) <= 18)
    .slice(0, MAX_LOCAL_ENEMIES);
  const sourceNodeId = members[0]?.accessNodeId.status === "known" ? members[0].accessNodeId.value : null;
  const alternatives = visibleEnemies
    .slice(0, MAX_STRATEGIC_CONTACTS)
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
  const rememberedTarget = squad.objectiveId ? actorById.get(squad.objectiveId as ActorId) : undefined;
  const committedTarget =
    squad.role === "attack" && rememberedTarget?.relation === "enemy" && rememberedTarget.visibility === "visible"
      ? rememberedTarget
      : undefined;
  const immediateThreat = (committedTarget ? localEnemies : [])
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
      previousTarget.visibility === "visible" &&
      squad.tactics &&
      bestTarget &&
      bestTarget.score * 1000 < squad.tactics.targetScore * (1000 + AI_TACTICS_TARGET_SWITCH_IMPROVEMENT_PERMILLE)
  );
  const targetId =
    immediateThreat?.actorId ??
    committedTarget?.actorId ??
    (retainPrevious
      ? previousTarget?.actorId
      : ((bestTarget?.objectiveId as ActorId | undefined) ?? rememberedTarget?.actorId));
  const target = targetId ? actorById.get(targetId) : undefined;
  const visibleTarget = target?.visibility === "visible" ? target : undefined;
  const targetAwareMembers = visibleTarget
    ? members.filter((member) => canTarget(member, visibleTarget) && canSeeTarget(member, visibleTarget, catalog))
    : [];
  const estimate = estimateAiEngagementV1(members, localEnemies, profile.maxLocalEngagementPairsPerStep);
  const retreat = safeRetreatPosition(observation, state, members);
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
