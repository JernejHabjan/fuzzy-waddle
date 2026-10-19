import type { ActorId, Vector2Simple, Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";

/** Describes the valid horizontal tile range for an air formation. */
export interface AirFormationBounds {
  /** Number of horizontal map tiles; valid x coordinates end at `width - 1`. */
  readonly width: number;
  /** Number of vertical map tiles; valid y coordinates end at `height - 1`. */
  readonly height: number;
}

/**
 * Generates unique, map-bounded tiles in concentric square rings around an anchor.
 * Ring traversal is fixed clockwise from the north-west corner so every lockstep
 * client derives the same candidate order without consulting ground navigation.
 */
export function generateAirFormationCandidates(
  anchor: Vector2Simple,
  bounds: AirFormationBounds,
  requestedCount: number
): Vector2Simple[] {
  if (requestedCount <= 0 || bounds.width <= 0 || bounds.height <= 0) return [];

  const maximumCount = Math.min(requestedCount, bounds.width * bounds.height);
  const candidates: Vector2Simple[] = [];
  const seen = new Set<string>();
  const maximumRadius = Math.max(bounds.width, bounds.height);

  const addCandidate = (x: number, y: number) => {
    const tile = {
      x: clampTileCoordinate(x, bounds.width),
      y: clampTileCoordinate(y, bounds.height)
    } satisfies Vector2Simple;
    const key = `${tile.x},${tile.y}`;
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push(tile);
  };

  addCandidate(anchor.x, anchor.y);
  for (let radius = 1; candidates.length < maximumCount && radius <= maximumRadius; radius++) {
    const left = anchor.x - radius;
    const right = anchor.x + radius;
    const top = anchor.y - radius;
    const bottom = anchor.y + radius;

    for (let x = left; x <= right; x++) addCandidate(x, top);
    for (let y = top + 1; y <= bottom; y++) addCandidate(right, y);
    for (let x = right - 1; x >= left; x--) addCandidate(x, bottom);
    for (let y = bottom - 1; y > top; y--) addCandidate(left, y);
  }

  return candidates.slice(0, maximumCount);
}

/**
 * Assigns sorted actor IDs to the first available spiral candidates. Reserved
 * tiles are excluded before assignment, so reversing selection input cannot
 * change actor-to-slot mapping.
 */
export function allocateAirFormationDestinations(
  anchor: Vector3Simple,
  actorIds: readonly ActorId[],
  bounds: AirFormationBounds,
  reservedTiles: readonly Vector2Simple[] = []
): ReadonlyMap<ActorId, Vector3Simple> {
  const sortedActorIds = Array.from(new Set(actorIds)).sort();
  const reservedKeys = new Set(reservedTiles.map((tile) => `${tile.x},${tile.y}`));
  const candidates = generateAirFormationCandidates(anchor, bounds, sortedActorIds.length + reservedKeys.size).filter(
    (tile) => !reservedKeys.has(`${tile.x},${tile.y}`)
  );

  const assignments = new Map<ActorId, Vector3Simple>();
  sortedActorIds.forEach((actorId, index) => {
    const tile = candidates[index];
    if (!tile) return;
    assignments.set(actorId, { x: tile.x, y: tile.y, z: anchor.z });
  });
  return assignments;
}

function clampTileCoordinate(value: number, size: number): number {
  return Math.min(Math.max(Math.round(value), 0), size - 1);
}
