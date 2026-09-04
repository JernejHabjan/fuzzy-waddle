import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";

/**
 * Determines ordinary actor visibility from its complete logical ground footprint.
 * The caller supplies the existing tile-key authority so this remains a pure presentation-policy helper.
 */
export function isAnyActorBaseTileVisible(
  baseTiles: readonly Vector2Simple[],
  visibleTiles: ReadonlySet<number>,
  toTileKey: (x: number, y: number) => number
): boolean {
  return baseTiles.some((tile) => visibleTiles.has(toTileKey(tile.x, tile.y)));
}
