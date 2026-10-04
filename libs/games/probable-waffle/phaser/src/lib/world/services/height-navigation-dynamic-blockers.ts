import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { MovementDynamicBlocker } from "./movement-occupancy.service";

/**
 * Converts dynamic actor blockers into temporary EasyStar blocked tile keys.
 * A blocker only applies when its actor footprint height matches the static
 * graph cell height, so actors on ground and elevated surfaces can share x/y.
 * @param dynamicBlockers Temporary occupancy blockers with their height layers.
 * @param getNavigableHeightAtTile Height lookup for the static graph cell at a tile.
 * @param fromTile The requesting actor's current tile, which stays passable.
 * @param toTile The query destination tile, which also stays passable.
 */
export function getDynamicBlockedTileKeysForHeightGraph(
  dynamicBlockers: MovementDynamicBlocker[],
  getNavigableHeightAtTile: (tile: Vector2Simple) => number | undefined,
  fromTile: Vector2Simple,
  toTile: Vector2Simple
): Set<string> {
  const blockedKeys = new Set<string>();
  for (const blocker of dynamicBlockers) {
    const { tile } = blocker;
    if (tile.x === fromTile.x && tile.y === fromTile.y) continue;
    if (tile.x === toTile.x && tile.y === toTile.y) continue;
    const navigableHeight = getNavigableHeightAtTile(tile);
    if (navigableHeight === undefined || Math.round(navigableHeight) !== Math.round(blocker.heightLayer)) continue;
    blockedKeys.add(`${tile.x},${tile.y}`);
  }
  return blockedKeys;
}
