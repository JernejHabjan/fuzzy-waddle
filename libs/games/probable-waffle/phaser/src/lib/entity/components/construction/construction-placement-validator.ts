import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
import type {
  ConstructionPlacementRule
} from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/construction/construction-placement-rule";
import { MovementTerrainType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/movement/movement-terrain-type";

export interface ConstructionTerrainProbe {
  isGroundNavigable(tile: Vector2Simple): boolean;
  isWaterNavigable(tile: Vector2Simple): boolean;
}

/**
 * Checks whether a single footprint cell is eligible under a building's placement rule
 * (used for per-tile placement grid previews).
 */
export function isConstructionTileEligibleForRule(
  tile: Vector2Simple,
  rule: ConstructionPlacementRule = "ground",
  probe: ConstructionTerrainProbe
): boolean {
  if (rule === "coastal") {
    return probe.isGroundNavigable(tile) || probe.isWaterNavigable(tile);
  }
  return probe.isGroundNavigable(tile);
}

/**
 * Validates an entire building footprint against its terrain placement rule.
 * - "ground": every tile must be ground-navigable.
 * - "coastal": every tile must be ground- or water-navigable, with at least one land tile and at least one water tile.
 */
export function isConstructionFootprintValidForRule(
  tiles: readonly Vector2Simple[],
  rule: ConstructionPlacementRule = "ground",
  probe: ConstructionTerrainProbe
): boolean {
  if (tiles.length === 0) return false;
  if (rule !== "coastal") {
    return tiles.every((tile) => probe.isGroundNavigable(tile));
  }

  let landTiles = 0;
  let waterTiles = 0;
  for (const tile of tiles) {
    const isLand = probe.isGroundNavigable(tile);
    const isWater = probe.isWaterNavigable(tile);
    if (!isLand && !isWater) return false;
    if (isLand) landTiles += 1;
    if (isWater) waterTiles += 1;
  }
  return landTiles >= 1 && waterTiles >= 1;
}

export function createNavigationTerrainProbe(
  navigation: {
    isTileNavigable(tile: Vector2Simple, terrainType?: MovementTerrainType): boolean;
    isTileGridWithoutBlockingObjectsNavigable?(tile: Vector2Simple): boolean;
  },
  ignoreBlockingObjects = false
): ConstructionTerrainProbe {
  return {
    isGroundNavigable: (tile) =>
      ignoreBlockingObjects && navigation.isTileGridWithoutBlockingObjectsNavigable
        ? navigation.isTileGridWithoutBlockingObjectsNavigable(tile)
        : navigation.isTileNavigable(tile, MovementTerrainType.Ground),
    isWaterNavigable: (tile) => navigation.isTileNavigable(tile, MovementTerrainType.Water)
  };
}
