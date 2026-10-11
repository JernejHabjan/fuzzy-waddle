import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import { HIGH_GROUND_THRESHOLD } from "../../../entity/components/combat/high-ground-constants";
import type { AiObservedActorV1, AiObservationV1 } from "../contracts/ai-observation-v1";

/** Only current visible weapon facts may justify resilient capacity; remembered contacts never become live weapons. */
export function observedAiProducerThreats(observation: AiObservationV1): readonly AiObservedActorV1[] {
  if (observation.threatSummary.observedTick !== observation.tick) return [];
  const ids = new Set(observation.threatSummary.visibleEnemyActorIds);
  return observation.actors.filter(
    (actor) =>
      actor.relation === "enemy" &&
      actor.visibility === "visible" &&
      ids.has(actor.actorId) &&
      actor.observedTick === observation.tick &&
      actor.logicalPosition.status === "known" &&
      actor.logicalPosition.observedTick === observation.tick &&
      actor.combatProfile?.status === "known" &&
      actor.combatProfile.observedTick === observation.tick
  );
}

/** Buildings are ground targets under the shared attack rule. Distances/ranges use logical tiles. */
export function isAiProducerPositionExposed(position: Vector3Simple, threats: readonly AiObservedActorV1[]): boolean {
  return threats.some((threat) => {
    if (threat.logicalPosition.status !== "known" || threat.combatProfile?.status !== "known") return false;
    const origin = threat.logicalPosition.value;
    const distance = Math.hypot(origin.x - position.x, origin.y - position.y);
    return threat.combatProfile.value.attacks.some((attack) => {
      const bonus = origin.z >= position.z + HIGH_GROUND_THRESHOLD ? attack.highGroundRangeBonus : 0;
      return (
        attack.damage > 0 &&
        attack.targetDomains.includes("ground") &&
        distance >= attack.minRange &&
        distance <= attack.range + bonus
      );
    });
  });
}

/** Bounded conservative ground flood; unknown cells and height transitions require another authority and are excluded. */
export function reachableAiConstructionTiles(
  observation: AiObservationV1,
  builder: AiObservedActorV1
): ReadonlySet<string> {
  const reachable = new Set<string>();
  if (builder.logicalPosition.status !== "known") return reachable;
  const cells = new Map((observation.map?.constructionCells ?? []).map((cell) => [cell.tileKey, cell]));
  const start = `${Math.round(builder.logicalPosition.value.x)},${Math.round(builder.logicalPosition.value.y)}`;
  const origin = cells.get(start);
  if (!origin || !origin.groundPassable || origin.observedBlocked) return reachable;
  const pending = [origin];
  reachable.add(start);
  for (let index = 0; index < pending.length; index += 1) {
    const current = pending[index];
    if (!current) continue;
    for (const [dx, dy] of [
      [-1, 0],
      [0, -1],
      [0, 1],
      [1, 0]
    ] as const) {
      const next = cells.get(`${current.position.x + dx},${current.position.y + dy}`);
      if (
        !next ||
        reachable.has(next.tileKey) ||
        !next.groundPassable ||
        next.observedBlocked ||
        next.elevation !== current.elevation
      )
        continue;
      reachable.add(next.tileKey);
      pending.push(next);
    }
  }
  return reachable;
}

/** A known safe finished alternative already serves the compatible demand, so exposure alone never multiplies producers. */
export function needsAiProducerResilience(
  observation: AiObservationV1,
  producers: readonly AiObservedActorV1[],
  usefulDeficit: number
): boolean {
  if (usefulDeficit <= 0 || producers.length === 0) return false;
  const threats = observedAiProducerThreats(observation);
  return producers.every(
    (producer) =>
      producer.logicalPosition.status === "known" &&
      isAiProducerPositionExposed(producer.logicalPosition.value, threats)
  );
}
