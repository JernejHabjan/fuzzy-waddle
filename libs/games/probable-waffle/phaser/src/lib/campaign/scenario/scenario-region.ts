import type { Vector2Simple, Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { ScenarioRegionId } from "@fuzzy-waddle/probable-waffle-campaign";

/**
 * Defines the structured scenario region definition contract for this module. Its declared surface makes id,
 * shape, points, elevation policy, elevation explicit to every consumer. Use this shared shape rather than an
 * ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface ScenarioRegionDefinition {
  /**
   * stable id used by {@link ScenarioRegionDefinition} to correlate this value with related records, events, or
   * authored content; it is not a display label.
   */
  readonly id: ScenarioRegionId;
  /**
   * shape value carried by {@link ScenarioRegionDefinition}. Its declared type is the compatibility boundary for
   * producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly shape: "rectangle" | "polygon";
  /**
   * collection value on {@link ScenarioRegionDefinition}. Its element type defines the records that may cross
   * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly points: readonly Vector2Simple[];
  /**
   * discriminator for {@link ScenarioRegionDefinition}. It selects the valid branch and behavior, so producers
   * and consumers must keep it synchronized with the accompanying fields.
   */
  readonly elevationPolicy: "any" | "same-level" | "range";
  /**
   * Optional numeric elevation carried by {@link ScenarioRegionDefinition}. Its units and valid range are
   * defined by {@link ScenarioRegionDefinition} and must remain consistent across producers and consumers.
   */
  readonly elevation?: number;
  /**
   * Optional numeric minimum elevation carried by {@link ScenarioRegionDefinition}. Its units and valid range
   * are defined by {@link ScenarioRegionDefinition} and must remain consistent across producers and consumers.
   */
  readonly minimumElevation?: number;
  /**
   * Optional numeric maximum elevation carried by {@link ScenarioRegionDefinition}. Its units and valid range
   * are defined by {@link ScenarioRegionDefinition} and must remain consistent across producers and consumers.
   */
  readonly maximumElevation?: number;
}

/** Defines the scenario region runtime contract used by this module; its declared members form the compatible boundary for linked consumers. */
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

/**
 * Defines the structured scenario region membership change contract for this module. Its declared surface
 * makes subject id, region id, kind explicit to every consumer. Use this shared shape rather than an ad-hoc
 * object so adapters, persistence, and callers remain compatible.
 */
export interface ScenarioRegionMembershipChange {
  /**
   * stable subject id used by {@link ScenarioRegionMembershipChange} to correlate this value with related
   * records, events, or authored content; it is not a display label.
   */
  readonly subjectId: string;
  /**
   * stable region id used by {@link ScenarioRegionMembershipChange} to correlate this value with related
   * records, events, or authored content; it is not a display label.
   */
  readonly regionId: ScenarioRegionId;
  /**
   * discriminator for {@link ScenarioRegionMembershipChange}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  readonly kind: "entered" | "left";
}

/** Defines the scenario region membership tracker contract used by this module; its declared members form the compatible boundary for linked consumers. */
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
