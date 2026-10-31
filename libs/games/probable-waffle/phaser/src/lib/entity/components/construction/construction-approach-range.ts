import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";

/** A builder must reach a navigable tile just beyond the target's occupied footprint. */
export function constructionApproachRange(
  footprint: readonly Vector2Simple[],
  center: Vector2Simple | undefined
): number {
  if (!center || footprint.length === 0) return 1;
  return Math.max(
    1,
    ...footprint.map((tile) => Math.max(Math.abs(tile.x - center.x), Math.abs(tile.y - center.y)) + 1)
  );
}
