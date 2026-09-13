import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";

interface ScoredBuildSpot {
  readonly tile: Vector2Simple;
  readonly score: number;
}

/**
 * Filters building candidates only after every asynchronous path query has resolved.
 * The returned candidates preserve their input order so the planner's explicit scoring
 * comparator remains the sole authority for deterministic selection.
 */
export async function filterReachableBuildSpots(
  candidates: readonly Vector2Simple[],
  origin: Vector2Simple,
  findPath: (from: Vector2Simple, to: Vector2Simple) => Promise<Vector2Simple[] | null>
): Promise<Vector2Simple[]> {
  const evaluatedCandidates = await Promise.all(
    candidates.map(async (tile) => ({
      tile,
      path: await findPath(origin, tile)
    }))
  );

  return evaluatedCandidates.filter(({ path }) => Array.isArray(path) && path.length > 0).map(({ tile }) => tile);
}

/**
 * Orders build candidates by descending score, then by logical coordinates.
 * Coordinate tie-breakers prevent analyzer iteration order from changing equal-score plans.
 */
export function compareScoredBuildSpots(left: ScoredBuildSpot, right: ScoredBuildSpot): number {
  const scoreOrder = right.score - left.score;
  if (scoreOrder !== 0) return scoreOrder;

  const xOrder = left.tile.x - right.tile.x;
  return xOrder !== 0 ? xOrder : left.tile.y - right.tile.y;
}
