import type { Vector2Simple, Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { ScenarioRegionId } from "@fuzzy-waddle/probable-waffle-campaign";

export interface ScenarioRegionDefinition {
  readonly id: ScenarioRegionId;
  readonly shape: "rectangle" | "polygon";
  readonly points: readonly Vector2Simple[];
  readonly elevationPolicy: "any" | "same-level" | "range";
  readonly elevation?: number;
  readonly minimumElevation?: number;
  readonly maximumElevation?: number;
}

/** Deterministic logical-space region; display/camera bounds never participate in membership. */
export class ScenarioRegionRuntime {
  constructor(readonly definition: ScenarioRegionDefinition) {
    if (definition.points.length < 3) {
      throw new Error(`Scenario region '${definition.id}' requires at least three points`);
    }
  }

  contains(position: Vector3Simple): boolean {
    if (!this.matchesElevation(position.z)) return false;
    return this.definition.shape === "rectangle" ? this.containsRectangle(position) : this.containsPolygon(position);
  }

  private matchesElevation(z: number): boolean {
    switch (this.definition.elevationPolicy) {
      case "any":
        return true;
      case "same-level":
        return z === (this.definition.elevation ?? 0);
      case "range":
        return z >= (this.definition.minimumElevation ?? 0) && z <= (this.definition.maximumElevation ?? 0);
    }
  }

  private containsRectangle(position: Vector2Simple): boolean {
    const xs = this.definition.points.map((point) => point.x);
    const ys = this.definition.points.map((point) => point.y);
    const minimumX = Math.min(...xs);
    const maximumX = Math.max(...xs);
    const minimumY = Math.min(...ys);
    const maximumY = Math.max(...ys);
    // Left/top edges are inclusive and right/bottom edges are exclusive so adjacent regions never double-claim a point.
    return position.x >= minimumX && position.x < maximumX && position.y >= minimumY && position.y < maximumY;
  }

  private containsPolygon(position: Vector2Simple): boolean {
    const points = this.definition.points;
    let inside = false;
    for (let index = 0, previous = points.length - 1; index < points.length; previous = index, index += 1) {
      const currentPoint = points[index]!;
      const previousPoint = points[previous]!;
      if (isPointOnSegment(position, previousPoint, currentPoint)) return true;
      const crosses =
        currentPoint.y > position.y !== previousPoint.y > position.y &&
        position.x <
          ((previousPoint.x - currentPoint.x) * (position.y - currentPoint.y)) / (previousPoint.y - currentPoint.y) +
            currentPoint.x;
      if (crosses) inside = !inside;
    }
    return inside;
  }
}

export interface ScenarioRegionMembershipChange {
  readonly subjectId: string;
  readonly regionId: ScenarioRegionId;
  readonly kind: "entered" | "left";
}

/** Tracks edge transitions from deterministic positions and emits changes in stable region-ID order. */
export class ScenarioRegionMembershipTracker {
  private readonly membershipBySubject = new Map<string, Set<ScenarioRegionId>>();

  update(
    subjectId: string,
    position: Vector3Simple,
    regions: readonly ScenarioRegionRuntime[]
  ): ScenarioRegionMembershipChange[] {
    const previous = this.membershipBySubject.get(subjectId) ?? new Set<ScenarioRegionId>();
    const current = new Set(
      regions
        .filter((region) => region.contains(position))
        .map((region) => region.definition.id)
        .sort()
    );
    const changes: ScenarioRegionMembershipChange[] = [];
    for (const regionId of [...current].sort()) {
      if (!previous.has(regionId)) changes.push({ subjectId, regionId, kind: "entered" });
    }
    for (const regionId of [...previous].sort()) {
      if (!current.has(regionId)) changes.push({ subjectId, regionId, kind: "left" });
    }
    this.membershipBySubject.set(subjectId, current);
    return changes;
  }

  remove(subjectId: string): void {
    this.membershipBySubject.delete(subjectId);
  }
}

function isPointOnSegment(point: Vector2Simple, start: Vector2Simple, end: Vector2Simple): boolean {
  const cross = (point.y - start.y) * (end.x - start.x) - (point.x - start.x) * (end.y - start.y);
  if (cross !== 0) return false;
  return (
    point.x >= Math.min(start.x, end.x) &&
    point.x <= Math.max(start.x, end.x) &&
    point.y >= Math.min(start.y, end.y) &&
    point.y <= Math.max(start.y, end.y)
  );
}
