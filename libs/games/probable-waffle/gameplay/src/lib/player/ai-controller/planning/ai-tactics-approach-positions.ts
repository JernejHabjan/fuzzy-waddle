import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { AiAccessNodeId } from "../contracts/ai-core-types";
import type { AiSquadStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiObservationV1, AiObservedActorV1 } from "../contracts/ai-observation-v1";

function hasKnownGroundRoute(
  sourceNodeId: AiAccessNodeId,
  targetNodeId: AiAccessNodeId,
  observation: AiObservationV1
): boolean | undefined {
  const graph = observation.map?.accessGraph;
  if (graph?.status !== "ready") return undefined;
  const nodes = new Map(graph.nodes.map((node) => [node.nodeId, node]));
  const source = nodes.get(sourceNodeId);
  const target = nodes.get(targetNodeId);
  if (!source || !target || source.domain !== "ground" || target.domain !== "ground") return false;
  if (source.knowledge === "unknown" || target.knowledge === "unknown") return false;
  if (source.clearance < 1 || target.clearance < 1) return false;
  const queue = [sourceNodeId];
  const visited = new Set(queue);
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor];
    if (current === targetNodeId) return true;
    for (const link of graph.links) {
      if (
        link.domain !== "ground" ||
        link.knowledge === "unknown" ||
        link.clearance < 1 ||
        (link.fromNodeId !== current && (link.directional || link.toNodeId !== current))
      )
        continue;
      const next = link.toNodeId;
      if (visited.has(next)) continue;
      visited.add(next);
      queue.push(next);
    }
  }
  return false;
}

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
    .filter(
      (cell) =>
        distance(cell.position, target) <= 16 &&
        (cell.position.x !== target.x || cell.position.y !== target.y) &&
        !cell.observedBlocked
    )
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
      if (domains.has("ground") && member.accessNodeId.status === "known" && observation.map?.accessGraph?.status === "ready") {
        if (!candidate.groundAccessNodeId) return false;
        if (hasKnownGroundRoute(member.accessNodeId.value, candidate.groundAccessNodeId, observation) !== true)
          return false;
      }
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
