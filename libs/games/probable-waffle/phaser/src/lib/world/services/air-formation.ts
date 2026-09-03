import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";

/** Inclusive tile coordinates available to an air formation. */
export interface AirFormationBounds {
  /** Lowest valid horizontal tile coordinate. */
  minX: number;
  /** Highest valid horizontal tile coordinate. */
  maxX: number;
  /** Lowest valid vertical tile coordinate. */
  minY: number;
  /** Highest valid vertical tile coordinate. */
  maxY: number;
}

/**
 * Produces a deterministic square-spiral of air destinations around an anchor.
 *
 * Unlike ground formation discovery this deliberately knows nothing about terrain,
 * path connectivity, or height. Clamping can make several spiral coordinates map
 * to one edge tile, so duplicates are removed while preserving the first stable
 * occurrence. The caller owns the flight layer and reservation lifecycle.
 */
export function getAirFormationCandidates(
  anchor: Vector2Simple,
  bounds: AirFormationBounds,
  maxRadius: number
): Vector2Simple[] {
  const candidates: Vector2Simple[] = [];
  const seen = new Set<string>();

  for (let radius = 0; radius <= maxRadius; radius++) {
    if (radius === 0) {
      addClampedCandidate(anchor.x, anchor.y, bounds, seen, candidates);
      continue;
    }

    for (let x = anchor.x - radius; x <= anchor.x + radius; x++) {
      addClampedCandidate(x, anchor.y - radius, bounds, seen, candidates);
    }
    for (let y = anchor.y - radius + 1; y <= anchor.y + radius; y++) {
      addClampedCandidate(anchor.x + radius, y, bounds, seen, candidates);
    }
    for (let x = anchor.x + radius - 1; x >= anchor.x - radius; x--) {
      addClampedCandidate(x, anchor.y + radius, bounds, seen, candidates);
    }
    for (let y = anchor.y + radius - 1; y > anchor.y - radius; y--) {
      addClampedCandidate(anchor.x - radius, y, bounds, seen, candidates);
    }
  }

  return candidates;
}

/**
 * Resolves one simultaneous-command slot from stable actor ordering. The caller
 * supplies only flyers, so mixed ground selections cannot consume air slots.
 */
export function getAirFormationCandidateForActor(
  actorId: string,
  flyingActorIds: readonly string[],
  candidates: readonly Vector2Simple[]
): Vector2Simple | undefined {
  const index = [...flyingActorIds].sort().indexOf(actorId);
  return index >= 0 ? candidates[index] : undefined;
}

/** Adds one bounds-clamped tile only once, retaining spiral order after clamping. */
function addClampedCandidate(
  x: number,
  y: number,
  bounds: AirFormationBounds,
  seen: Set<string>,
  candidates: Vector2Simple[]
): void {
  const candidate = {
    x: Math.min(Math.max(x, bounds.minX), bounds.maxX),
    y: Math.min(Math.max(y, bounds.minY), bounds.maxY)
  } satisfies Vector2Simple;
  const key = `${candidate.x},${candidate.y}`;
  if (seen.has(key)) return;
  seen.add(key);
  candidates.push(candidate);
}
