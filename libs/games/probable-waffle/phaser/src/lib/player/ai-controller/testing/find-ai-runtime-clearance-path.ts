import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { HeightNavigationGraph } from "../../../world/services/height-navigation-graph-builder";

const key = (tile: Vector2Simple) => `${tile.x},${tile.y}`;

/** Walk current native directed edges with a conservative square envelope; no cached result or planner input. */
export function findAiRuntimeClearancePath(
  graph: HeightNavigationGraph, from: Vector2Simple, to: Vector2Simple, tileMargin: number
): { status: "path" | "blocked" | "unavailable"; path: Vector2Simple[] | null; visitedTiles: number; gaps: string[] } {
  const unavailable = (gap: string, visitedTiles = 0) =>
    ({ status: "unavailable" as const, path: null, visitedTiles, gaps: [gap] });
  if (!Number.isSafeInteger(tileMargin) || tileMargin < 0 || tileMargin > 2 ||
      ![from.x, from.y, to.x, to.y].every((coordinate) => Number.isSafeInteger(coordinate) && coordinate >= 0)) {
    return unavailable("placement_route_arguments_invalid");
  }
  if (key(from) === key(to)) return unavailable("placement_route_degenerate_endpoints");
  const allowed = (tile: Vector2Simple): boolean => {
    const cell = graph.cells[tile.y]?.[tile.x];
    if (!cell?.isNavigable) return false;
    for (let dy = -tileMargin; dy <= tileMargin; dy++) {
      for (let dx = -tileMargin; dx <= tileMargin; dx++) {
        const neighbor = graph.cells[tile.y + dy]?.[tile.x + dx];
        if (!neighbor?.isNavigable || neighbor.navigableHeight !== cell.navigableHeight) return false;
      }
    }
    return true;
  };
  if (!allowed(from) || !allowed(to)) return { status: "blocked", path: null, visitedTiles: 0, gaps: [] };
  const queue = [from];
  const parents = new Map<string, Vector2Simple | null>([[key(from), null]]);
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const current = queue[cursor];
    if (!current) return unavailable("placement_route_reader_inconsistent", parents.size);
    if (key(current) === key(to)) {
      const path: Vector2Simple[] = [];
      let step: Vector2Simple | null | undefined = current;
      while (step) {
        path.push({ ...step });
        if (path.length > 512) return unavailable("placement_route_path_overflow", parents.size);
        step = parents.get(key(step));
      }
      return { status: "path", path: path.reverse(), visitedTiles: parents.size, gaps: [] };
    }
    for (const edge of graph.edgesByTileKey.get(key(current)) ?? []) {
      const next = edge.to;
      if (parents.has(key(next)) || !allowed(next)) continue;
      // Native EasyStar keeps corner cutting disabled. The envelope cannot squeeze diagonally between blockers.
      if (next.x !== current.x && next.y !== current.y &&
          (!allowed({ x: current.x, y: next.y }) || !allowed({ x: next.x, y: current.y }))) continue;
      if (parents.size >= 16384) return unavailable("placement_route_search_overflow", parents.size);
      parents.set(key(next), current);
      queue.push({ ...next });
    }
  }
  return { status: "blocked", path: null, visitedTiles: parents.size, gaps: [] };
}
