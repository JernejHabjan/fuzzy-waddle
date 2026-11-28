import type { WorldPoint } from "./nearest-actor";

/** Selects a point at a fixed distance from the origin, opposite the threat. */
export function escapePoint(origin: WorldPoint, threat: WorldPoint, distance: number): WorldPoint {
  const dx = origin.x - threat.x;
  const dy = origin.y - threat.y;
  const length = Math.hypot(dx, dy);
  return {
    x: origin.x + (length ? dx / length : 1) * distance,
    y: origin.y + (length ? dy / length : 0) * distance
  };
}
