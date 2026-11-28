/** A position in world pixels. */
export interface WorldPoint {
  readonly x: number;
  readonly y: number;
}

/** Selects the nearest eligible object inside a radius, preserving input order for ties. */
export function nearestActor<T extends WorldPoint>(
  origin: WorldPoint,
  candidates: Iterable<T>,
  radius: number,
  eligible: (candidate: T) => boolean
): T | undefined {
  let nearest: T | undefined;
  let closestSquared = radius * radius;
  for (const candidate of candidates) {
    if (!eligible(candidate)) continue;
    const distanceSquared = (candidate.x - origin.x) ** 2 + (candidate.y - origin.y) ** 2;
    if (distanceSquared > closestSquared || (nearest && distanceSquared === closestSquared)) continue;
    closestSquared = distanceSquared;
    nearest = candidate;
  }
  return nearest;
}
