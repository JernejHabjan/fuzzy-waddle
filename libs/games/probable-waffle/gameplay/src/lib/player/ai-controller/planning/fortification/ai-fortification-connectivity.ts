import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { ConstructionCell } from "./ai-fortification-support";

function reachable(
  cells: ReadonlyMap<string, ConstructionCell>,
  blocked: ReadonlySet<string>,
  startKey: string,
  clearanceRadiusTiles: number
): ReadonlySet<string> {
  const isPassable = (key: string): boolean => {
    if (!cells.get(key)?.groundPassable || blocked.has(key)) return false;
    if (clearanceRadiusTiles === 0) return true;
    const [xText = "0", yText = "0"] = key.split(",");
    const x = Number(xText),
      y = Number(yText);
    for (let dy = -clearanceRadiusTiles; dy <= clearanceRadiusTiles; dy++) {
      for (let dx = -clearanceRadiusTiles; dx <= clearanceRadiusTiles; dx++) {
        const neighbor = `${x + dx},${y + dy}`;
        if (!cells.get(neighbor)?.groundPassable || blocked.has(neighbor)) return false;
      }
    }
    return true;
  };
  if (!isPassable(startKey)) return new Set();
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
      if (visited.has(next) || !isPassable(next)) continue;
      visited.add(next);
      queue.push(next);
    }
  }
  return visited;
}

function nearestPassableKey(
  cells: ReadonlyMap<string, ConstructionCell>,
  blocked: ReadonlySet<string>,
  position: Vector3Simple,
  clearanceRadiusTiles: number
): string | null {
  const candidates = [...cells.values()]
    .filter((cell) => cell.groundPassable && !blocked.has(cell.tileKey))
    .map((cell) => ({
      cell,
      distance: Math.abs(cell.position.x - position.x) + Math.abs(cell.position.y - position.y)
    }))
    .filter((candidate) => {
      for (let dy = -clearanceRadiusTiles; dy <= clearanceRadiusTiles; dy++) {
        for (let dx = -clearanceRadiusTiles; dx <= clearanceRadiusTiles; dx++) {
          const key = `${candidate.cell.position.x + dx},${candidate.cell.position.y + dy}`;
          if (!cells.get(key)?.groundPassable || blocked.has(key)) return false;
        }
      }
      return true;
    })
    .filter((candidate) => candidate.distance <= 2)
    .sort(
      (left, right) =>
        left.distance - right.distance ||
        left.cell.position.y - right.cell.position.y ||
        left.cell.position.x - right.cell.position.x
    );
  return candidates[0]?.cell.tileKey ?? null;
}

/** Pure whole-layout check used by the manager and deterministic fortification fixtures. */
export function fortificationPreservesConnectivity(input: {
  readonly cells: readonly ConstructionCell[];
  readonly blockedTileKeys: readonly string[];
  readonly protectedPosition: Vector3Simple;
  readonly openingPosition: Vector3Simple;
  readonly exteriorPosition: Vector3Simple;
  readonly requiredPositions: readonly Vector3Simple[];
  /** Static/resource positions that need one-tile access, not a wide-unit corridor. */
  readonly narrowRequiredPositions?: readonly Vector3Simple[];
  /** Require protected/opening/exterior probes to remain on their authored tiles. */
  readonly exactRoutePositions?: boolean;
  /** Require a route with this many clear tiles around every path tile. */
  readonly clearanceRadiusTiles?: number;
}): boolean {
  const cells = new Map(input.cells.map((cell) => [cell.tileKey, cell]));
  const blocked = new Set(input.blockedTileKeys);
  const clearanceRadiusTiles = input.clearanceRadiusTiles ?? 0;
  if (!Number.isSafeInteger(clearanceRadiusTiles) || clearanceRadiusTiles < 0 || clearanceRadiusTiles > 2) return false;
  const exactOpeningKey = `${Math.round(input.openingPosition.x)},${Math.round(input.openingPosition.y)}`;
  // An intentional opening cannot be substituted by a nearby tile when that entrance is actually sealed.
  if (!cells.get(exactOpeningKey)?.groundPassable || blocked.has(exactOpeningKey)) return false;
  const routePositions = [input.protectedPosition, input.openingPosition, input.exteriorPosition];
  const exactRouteKeys = routePositions.map((position) => `${Math.round(position.x)},${Math.round(position.y)}`);
  if (input.exactRoutePositions && exactRouteKeys.some((key) => !cells.get(key)?.groundPassable || blocked.has(key)))
    return false;
  const [protectedKey, openingKey, exteriorKey] = routePositions.map((position) =>
    nearestPassableKey(cells, blocked, position, clearanceRadiusTiles)
  );
  if (!protectedKey || !openingKey || !exteriorKey) return false;
  const connected = reachable(cells, blocked, openingKey, clearanceRadiusTiles);
  if (!connected.has(protectedKey) || !connected.has(exteriorKey)) return false;
  if (
    !input.requiredPositions.every((position) => {
      const key = nearestPassableKey(cells, blocked, position, clearanceRadiusTiles);
      return key !== null && connected.has(key);
    })
  )
    return false;
  if (!input.narrowRequiredPositions?.length) return true;
  const singleTileConnected = clearanceRadiusTiles === 0 ? connected : reachable(cells, blocked, openingKey, 0);
  return input.narrowRequiredPositions.every((position) => {
    const key = nearestPassableKey(cells, blocked, position, 0);
    return key !== null && singleTileConnected.has(key);
  });
}
