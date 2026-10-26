import type { AiPlanId } from "../contracts/ai-core-types";
import { OrderType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import { canTarget } from "./ai-tactics-combat";
import { distance } from "./ai-tactics-geometry";
import { intentBase } from "./ai-tactics-orders";
import { proposeAiTacticalSupport } from "./ai-tactics-support";

import type { projectAiTacticalSquad } from "./ai-tactics-mission-projection";
/** Emits quota-bound native combat and support intents. */
export function proposeAiTacticalOrders(input: ReturnType<typeof projectAiTacticalSquad>) {
  const {
    actorById,
    actorsNeedingOrder,
    anchor,
    assignedPositions,
    damageReservations,
    intents,
    localEnemies,
    materiallyChanged,
    members,
    observation,
    previousDamageEffectIds,
    profile,
    recoveryPhase,
    retreat,
    support,
    targetAwareMembers,
    updated,
    visibleTarget
  } = input;
  const searchDestinations = observation.map?.scoutSearchPoints?.map((point) => point.position) ?? [];
  const hasNativeSearchOrder =
    searchDestinations.length > 0 &&
    members.length > 0 &&
    members.every((member) => {
      const activeOrder = member.activeOrder?.status === "known" ? member.activeOrder.value : null;
      if (activeOrder?.orderType !== OrderType.Move) return false;
      const activeDestination = activeOrder.targetPosition;
      if (activeDestination)
        return searchDestinations.some((destination) => distance(activeDestination, destination) <= 4);
      return updated.tactics?.orderedActorIds.includes(member.actorId) ?? false;
    });
  const preserveSearchOrder =
    updated.role === "scout" &&
    updated.objectiveId?.startsWith("question:") &&
    localEnemies.length === 0 &&
    hasNativeSearchOrder;
  if (!preserveSearchOrder && materiallyChanged && updated.state === "retreat" && retreat) {
    const batch = actorsNeedingOrder.slice(0, profile.maxActorOrdersPerStep);
    if (batch.length > 0)
      intents.push({
        ...intentBase(
          observation,
          { ...updated, actorIds: batch },
          `protected_retreat:${batch[0]}:${batch[batch.length - 1]}`,
          980
        ),
        kind: "move",
        actorIds: batch,
        logicalPosition: retreat
      });
  } else if (
    !preserveSearchOrder &&
    materiallyChanged &&
    (updated.state === "engage" || updated.state === "advance") &&
    visibleTarget &&
    damageReservations.length > 0
  ) {
    for (const reservation of damageReservations) {
      if (reservation.effectId && previousDamageEffectIds.has(reservation.effectId)) continue;
      const attacker = actorById.get(reservation.actorId);
      const reservedTarget = actorById.get(reservation.targetActorId);
      if (!attacker || !reservedTarget || !canTarget(attacker, reservedTarget)) continue;
      const activeOrder = attacker.activeOrder?.status === "known" ? attacker.activeOrder.value : null;
      // A damage forecast expires before a native attack job; replacing that job restarts its approach/windup.
      if (activeOrder?.orderType === OrderType.Attack && activeOrder.targetActorId === reservedTarget.actorId) continue;
      const single = { ...updated, actorIds: [attacker.actorId] };
      intents.push({
        ...intentBase(observation, single, `focus:${visibleTarget.actorId}:${attacker.actorId}`, 820),
        ...(reservation.effectId ? { effectId: reservation.effectId as AiIntentV1["effectId"] } : {}),
        preconditions: [
          { kind: "plan_active", planId: `plan:${updated.squadId}` as AiPlanId },
          { kind: "target_visible", actorId: reservedTarget.actorId }
        ],
        kind: "attack",
        actorIds: [attacker.actorId],
        targetActorId: reservation.targetActorId,
        targetPosition: null
      });
    }
    // Fighting members and distant reinforcements need independent orders in the same decision.
    const awareIds = new Set(targetAwareMembers.map((actor) => actor.actorId));
    for (const assignment of assignedPositions.filter(
      (entry) => actorsNeedingOrder.includes(entry.actorId) && !awareIds.has(entry.actorId)
    )) {
      intents.push({
        ...intentBase(
          observation,
          { ...updated, actorIds: [assignment.actorId] },
          `position:${assignment.actorId}`,
          updated.role === "defense" ? 860 : 720
        ),
        kind: "move",
        actorIds: [assignment.actorId],
        logicalPosition: assignment.position
      });
    }
  } else if (!preserveSearchOrder && materiallyChanged && anchor && !["completed", "cancelled"].includes(updated.state)) {
    if (assignedPositions.length > 0) {
      for (const assignment of assignedPositions.filter((entry) => actorsNeedingOrder.includes(entry.actorId))) {
        const positioned = { ...updated, actorIds: [assignment.actorId] };
        intents.push({
          ...intentBase(
            observation,
            positioned,
            `position:${assignment.actorId}`,
            updated.role === "defense" ? 860 : 720
          ),
          kind: "move",
          actorIds: [assignment.actorId],
          logicalPosition: assignment.position
        });
      }
    } else if (updated.role !== "attack" || recoveryPhase || !observation.map?.tacticalCells?.length) {
      const batch = actorsNeedingOrder.slice(0, profile.maxActorOrdersPerStep);
      if (batch.length > 0)
        intents.push({
          ...intentBase(
            observation,
            { ...updated, actorIds: batch },
            `move:${updated.state}:${batch[0]}:${batch[batch.length - 1]}`,
            720
          ),
          kind: "move",
          actorIds: batch,
          logicalPosition: anchor
        });
    }
  }

  proposeAiTacticalSupport(
    observation,
    updated,
    members.slice(0, profile.maxActorOrdersPerStep),
    localEnemies,
    support,
    intents
  );
}
