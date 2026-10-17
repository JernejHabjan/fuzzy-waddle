import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { AiSquadStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiObservationV1, AiObservedActorV1 } from "../contracts/ai-observation-v1";

function distance(left: Vector3Simple, right: Vector3Simple): number {
  return Math.abs(left.x - right.x) + Math.abs(left.y - right.y) + Math.abs(left.z - right.z);
}

/** Picks distinct observed passable cells near an occupied objective; the building center is never a move order. */
export function selectAiAttackApproachPositions(
  members: readonly AiObservedActorV1[],
  target: Vector3Simple,
  observation: AiObservationV1
): NonNullable<AiSquadStateV1["tactics"]>["assignedPositions"] {
  const origin = members[0]?.logicalPosition.status === "known" ? members[0].logicalPosition.value : target;
  const candidates = (observation.map?.tacticalCells ?? observation.map?.constructionCells ?? [])
    .filter((cell) => distance(cell.position, target) <= 16 && !cell.observedBlocked)
    .sort(
      (left, right) =>
        distance(left.position, target) * 10 +
          distance(left.position, origin) -
          (distance(right.position, target) * 10 + distance(right.position, origin)) ||
        left.tileKey.localeCompare(right.tileKey)
    );
  const used = new Set<string>();
  return members.flatMap((member) => {
    const domains = new Set(member.capabilities.flatMap((capability) => capability.domains));
    const cell = candidates.find((candidate) => {
      if (used.has(candidate.tileKey)) return false;
      if (
        !(
          domains.has("air") ||
          (domains.has("water") && candidate.waterPassable) ||
          (domains.has("ground") && candidate.groundPassable)
        )
      )
        return false;
      return !observation.effects.some(
        (effect) =>
          effect.influence === "harmful" && distance(effect.position, candidate.position) <= (effect.radius ?? 0) + 1
      );
    });
    if (!cell) return [];
    used.add(cell.tileKey);
    return [{ actorId: member.actorId, position: cell.position }];
  });
}
