import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { ConstructionCell } from "./ai-fortification-support";
function reachable(
  cells: ReadonlyMap<string, ConstructionCell>,
  blocked: ReadonlySet<string>,
  startKey: string
): ReadonlySet<string> {
  if (!cells.get(startKey)?.groundPassable || blocked.has(startKey)) return new Set();
  const visited = new Set([startKey]);
  const queue = [startKey];
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const [xText = "0", yText = "0"] = queue[cursor]?.split(",") ?? [];
    const x = Number(xText);
    const y = Number(yText);
    for (const [dx, dy] of [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0]
    ] as const) {
      const next = `${x + dx},${y + dy}`;
      if (visited.has(next) || blocked.has(next) || !cells.get(next)?.groundPassable) continue;
      visited.add(next);
      queue.push(next);
    }
  }
  return visited;
}

function nearestPassableKey(
  cells: ReadonlyMap<string, ConstructionCell>,
  blocked: ReadonlySet<string>,
  position: Vector3Simple
): string | null {
  const candidates = [...cells.values()]
    .filter((cell) => cell.groundPassable && !blocked.has(cell.tileKey))
    .map((cell) => ({
      cell,
      distance: Math.abs(cell.position.x - position.x) + Math.abs(cell.position.y - position.y)
    }))
    .filter((candidate) => candidate.distance <= 2)
    .sort(
      (left, right) =>
        left.distance - right.distance ||
        left.cell.position.y - right.cell.position.y ||
        left.cell.position.x - right.cell.position.x
    );
  return candidates[0]?.cell.tileKey ?? null;
}

/** Pure whole-layout check used by the manager and deterministic Stage 11 fixtures. */
export function fortificationPreservesConnectivityV1(input: {
  readonly cells: readonly ConstructionCell[];
  readonly blockedTileKeys: readonly string[];
  readonly protectedPosition: Vector3Simple;
  readonly openingPosition: Vector3Simple;
  readonly exteriorPosition: Vector3Simple;
  readonly requiredPositions: readonly Vector3Simple[];
}): boolean {
  const cells = new Map(input.cells.map((cell) => [cell.tileKey, cell]));
  const blocked = new Set(input.blockedTileKeys);
  const openingKey = nearestPassableKey(cells, blocked, input.openingPosition);
  const protectedKey = nearestPassableKey(cells, blocked, input.protectedPosition);
  const exteriorKey = nearestPassableKey(cells, blocked, input.exteriorPosition);
  if (!openingKey || !protectedKey || !exteriorKey) return false;
  const connected = reachable(cells, blocked, openingKey);
  if (!connected.has(protectedKey) || !connected.has(exteriorKey)) return false;
  return input.requiredPositions.every((position) => {
    const key = nearestPassableKey(cells, blocked, position);
    return key !== null && connected.has(key);
  });
}
