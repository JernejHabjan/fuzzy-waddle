import type { AiPlanId } from "../contracts/ai-core-types";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import { canTarget } from "./ai-tactics-combat";
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
    updated,
    visibleTarget
  } = input;
  if (materiallyChanged && updated.state === "retreat" && retreat) {
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
  } else if (materiallyChanged && anchor && !["completed", "cancelled"].includes(updated.state)) {
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
