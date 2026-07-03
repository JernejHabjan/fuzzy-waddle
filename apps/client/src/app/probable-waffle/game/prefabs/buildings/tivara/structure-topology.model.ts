import type { NavigablePath } from "../../../entity/components/movement/navigable-path";

/**
 * Shared tile-adjacency model for Tivara elevated structures.
 *
 * This is intentionally tile-based, not sprite/world-offset based. Walls,
 * stairs, and towers derive visuals and navigable ports from the same
 * 8-direction neighbor graph so rendered shape and navigation stay aligned.
 */
export type StructureNeighborDirections = Required<NavigablePath>;

export type StructureDirectionKey = keyof StructureNeighborDirections;
export type StructureCornerKey = "topLeft" | "topRight" | "bottomLeft" | "bottomRight";

/**
 * Normalizes a partial neighbor snapshot into an explicit 8-direction boolean
 * structure so topology logic can rely on absent values meaning false.
 */
export function toStructureNeighborDirections(
  directions: Partial<StructureNeighborDirections>
): StructureNeighborDirections {
  return {
    top: directions.top === true,
    bottom: directions.bottom === true,
    left: directions.left === true,
    right: directions.right === true,
    topLeft: directions.topLeft === true,
    topRight: directions.topRight === true,
    bottomLeft: directions.bottomLeft === true,
    bottomRight: directions.bottomRight === true
  };
}

/**
 * Wall navigation opens direct cardinal neighbors and also opens a cardinal
 * side when both corner neighbors along that side are present.
 */
export function buildWallAccessDirections(
  directions: Partial<StructureNeighborDirections>
): StructureNeighborDirections {
  const neighbors = toStructureNeighborDirections(directions);
  const access = toStructureNeighborDirections(neighbors);

  if (neighbors.topLeft && neighbors.topRight) access.top = true;
  if (neighbors.bottomLeft && neighbors.bottomRight) access.bottom = true;
  if (neighbors.topLeft && neighbors.bottomLeft) access.left = true;
  if (neighbors.topRight && neighbors.bottomRight) access.right = true;

  return access;
}

/**
 * Wall art is named by extended/blocked corners. Diagonal neighbors open their
 * exact corner. Cardinal-only sides span both corners, but a cardinal neighbor
 * does not override an already-expressed diagonal shape on that side.
 */
export function buildWallOpenVisualCorners(
  directions: Partial<StructureNeighborDirections>
): Record<StructureCornerKey, boolean> {
  const neighbors = toStructureNeighborDirections(directions);
  const openCorners = {
    topLeft: neighbors.topLeft,
    topRight: neighbors.topRight,
    bottomLeft: neighbors.bottomLeft,
    bottomRight: neighbors.bottomRight
  };

  if (neighbors.top && !neighbors.topLeft && !neighbors.topRight) {
    openCorners.topLeft = true;
    openCorners.topRight = true;
  }
  if (neighbors.bottom && !neighbors.bottomLeft && !neighbors.bottomRight) {
    openCorners.bottomLeft = true;
    openCorners.bottomRight = true;
  }
  if (neighbors.left && !neighbors.topLeft && !neighbors.bottomLeft) {
    openCorners.topLeft = true;
    openCorners.bottomLeft = true;
  }
  if (neighbors.right && !neighbors.topRight && !neighbors.bottomRight) {
    openCorners.topRight = true;
    openCorners.bottomRight = true;
  }

  return openCorners;
}

/**
 * Returns true when any of the candidate directions is present in the
 * normalized neighbor set.
 */
export function hasAnyStructureDirection(
  directions: Partial<StructureNeighborDirections>,
  candidates: StructureDirectionKey[]
): boolean {
  const normalized = toStructureNeighborDirections(directions);
  return candidates.some((direction) => normalized[direction]);
}

/**
 * Counts how many of the requested directions are present so callers can rank
 * prefab matches deterministically.
 */
export function countStructureDirectionMatches(
  directions: Partial<StructureNeighborDirections>,
  candidates: StructureDirectionKey[]
): number {
  const normalized = toStructureNeighborDirections(directions);
  return candidates.reduce((count, direction) => count + (normalized[direction] ? 1 : 0), 0);
}
