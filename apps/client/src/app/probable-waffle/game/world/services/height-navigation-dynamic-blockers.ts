import type { Vector2Simple } from "@fuzzy-waddle/api-interfaces";
import type { MovementDynamicBlocker } from "./movement-occupancy.service";

/**
 * Converts dynamic actor blockers into temporary EasyStar blocked tile keys.
 * A blocker only applies when its actor footprint height matches the static
 * graph cell height, so actors on ground and elevated surfaces can share x/y.
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
