import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
import type Phaser from "phaser";
import type { GameObjects } from "phaser";
import { MovementTerrainType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/movement/movement-terrain-type";
import { getActorComponent } from "../../data/actor-component";
import { RepresentableComponent } from "../../entity/components/representable-component";
import { getTileCoordsUnderObject } from "../../library/tile-under-object";
import type { NavigationService } from "./navigation.service";
import type { RandomService } from "./random.service";
import type { ActorIndexSystem } from "./ActorIndexSystem";
import type { WaterNavigationHelper } from "./water-navigation.helper";

/** Owns native candidate ordering, RNG progression, occupied-tile sampling and spawn/radius searches. */
export class NavigationTileSelection {
  constructor(
    private readonly tilemap: Phaser.Tilemaps.Tilemap,
    private readonly navigation: Pick<NavigationService, "isWithinGridBounds" | "isTileNavigable">,
    private readonly groundGrid: () => number[][],
    private readonly waterNavHelper: Pick<WaterNavigationHelper, "getNavigableTilesInRadius">,
    private readonly randomService: () => Pick<RandomService, "between">,
    private readonly actorIndex: () => Pick<ActorIndexSystem, "getAllIdActors">,
    private readonly findPathForTerrain: (
      from: Vector2Simple, to: Vector2Simple, terrain: MovementTerrainType
    ) => Promise<Vector2Simple[] | null>
  ) {}

  /**
   * Samples native candidates until a nonempty path within the requested radius is found.
   */
  async randomTileInNavigableRadius(
    currentTile: Vector2Simple,
    radiusFromCurrentTile: number,
    terrainType: MovementTerrainType = MovementTerrainType.Ground
  ): Promise<Vector2Simple | null> {
    // 1. Get a list of valid tile coordinates within the radius
    const validTiles = this.validTilesInRadiusOfCurrentTile(currentTile, radiusFromCurrentTile, true, terrainType);

    // 2. Ensure there are valid tiles within the radius
    if (validTiles.length === 0) {
      return null;
    }

    // 3. Randomly pick tiles until a reachable one within the radius is found
    let attempts = 0;
    const maxAttempts = validTiles.length; // Limit attempts to prevent infinite loops
    while (attempts < maxAttempts) {
      const randomIndex = this.randomService().between(0, validTiles.length - 1);
      // Use the same sampled index for selection and removal to keep RNG progression deterministic.
      const tile = validTiles[randomIndex]!;

      // Check path to the random tile
      const path = await this.findPathForTerrain(currentTile, tile, terrainType);

      if (path) {
        // Calculate path length based on XY distances:
        const sumPathLengthByXY = path.reduce((sum, node, index) => {
          const previousNode = index === 0 ? currentTile : path[index - 1]; // Use currentTile as the "previous" for the first node
          if (!previousNode) return sum;
          const dx = Math.abs(node.x - previousNode.x);
          const dy = Math.abs(node.y - previousNode.y);
          // If diagonal movement is allowed, count diagonal steps as 1.414 tiles (approximate square root of 2)
          const diagonalCost = Math.sqrt(2); // Precalculate for efficiency
          const distance = dx + dy + (dx * dy === 1 ? diagonalCost - 2 : 0);
          return sum + distance;
        }, 0);

        if (path.length > 0 && sumPathLengthByXY <= radiusFromCurrentTile) {
          return tile; // Reachable tile within radius found, return it
        }
      }

      attempts++;
      validTiles.splice(randomIndex, 1); // Remove non-reachable or out-of-radius tile
    }

    // all attempts failed
    return null;
  }

  public randomTileInRadius(currentTile: Vector2Simple, radiusTiles: number): Vector2Simple | undefined {
    // 1. Get a list of valid tile coordinates within the radius
    const validTiles = this.validTilesInRadiusOfCurrentTile(currentTile, radiusTiles, true);

    // 2. Ensure there are valid tiles within the radius
    if (validTiles.length === 0) {
      return;
    }

    // 3. Randomly pick tiles until a reachable one within the radius is found
    const randomIndex = this.randomService().between(0, validTiles.length - 1);
    return validTiles[randomIndex];
  }

  /**
   * Doesn't respect blocked tiles under object
   */
  private validTilesInRadiusOfCurrentTile(
    currentTile: Vector2Simple,
    radiusTiles: number,
    navigable: boolean = false,
    terrainType: MovementTerrainType = MovementTerrainType.Ground
  ): Vector2Simple[] {
    if (terrainType === MovementTerrainType.Water) {
      return this.waterNavHelper.getNavigableTilesInRadius(currentTile, radiusTiles);
    }
    // 1. Get a list of valid tile coordinates within the radius
    const validTiles: Vector2Simple[] = [];
    for (let y = currentTile.y - radiusTiles; y <= currentTile.y + radiusTiles; y++) {
      for (let x = currentTile.x - radiusTiles; x <= currentTile.x + radiusTiles; x++) {
        const firstVal = this.groundGrid()[0];
        if (!firstVal) continue;
        // Ensure coordinates are within easyStarNavigationGrid bounds
        if (0 <= x && x < firstVal.length && 0 <= y && y < this.groundGrid().length) {
          if (navigable) {
            if (this.groundGrid()[y]?.[x] === 0) {
              validTiles.push({ x, y });
            }
          } else {
            validTiles.push({ x, y });
          }
        }
      }
    }

    return validTiles;
  }

  /** Chooses by distance, then y/x, within the footprint's Manhattan radius; it performs no path query. */
  getClosestNavigableTileAroundBlockedTilesInRadius(
    fromTile: Vector2Simple,
    blockedTiles: Vector2Simple[],
    radiusTiles: number = 6, // Default radius if not specified
    terrainType: MovementTerrainType = MovementTerrainType.Ground
  ): Vector2Simple | undefined {
    const navigableTiles: Set<string> = new Set(); // Use Set to avoid duplicates

    // Step 1: Loop through each blocked tile
    blockedTiles.forEach((blockedTile) => {
      // Loop through the surrounding tiles within the specified radius
      for (let dx = -radiusTiles; dx <= radiusTiles; dx++) {
        for (let dy = -radiusTiles; dy <= radiusTiles; dy++) {
          // Calculate the neighboring tile coordinates
          const neighbor: Vector2Simple = { x: blockedTile.x + dx, y: blockedTile.y + dy };

          // Check if the neighbor is within easyStarNavigationGrid bounds, navigable, and within radius
          if (
            this.navigation.isWithinGridBounds(neighbor, terrainType) &&
            this.navigation.isTileNavigable(neighbor, terrainType) &&
            Math.abs(dx) + Math.abs(dy) <= radiusTiles // Use Manhattan distance
          ) {
            // Use a string representation to store the tile in the Set
            navigableTiles.add(`${neighbor.x},${neighbor.y}`);
          }
        }
      }
    });

    // Convert Set to an array of Vector2Simple
    const navigableTilesArray = Array.from(navigableTiles).map((tile) => {
      const [x, y] = tile.split(",").map(Number);
      return { x: x!, y: y! };
    });

    // Step 2: Find the closest navigable tile to the fromTile
    if (navigableTilesArray.length === 0) {
      // console.warn("No navigable tiles found around the blocked tiles.");
      return undefined;
    }

    // Sort the navigable tiles based on distance to fromTile
    navigableTilesArray.sort((a, b) => this.compareTilesByDistanceThenCoordinates(a, b, fromTile));

    return navigableTilesArray[0]!; // Return the closest tile
  }

  private getTileDistance(tile1: Vector2Simple, tile2: Vector2Simple): number {
    const dx = tile1.x - tile2.x;
    const dy = tile1.y - tile2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private compareTilesByDistanceThenCoordinates(
    a: Vector2Simple,
    b: Vector2Simple,
    referenceTile: Vector2Simple
  ): number {
    const distanceDelta = this.getTileDistance(a, referenceTile) - this.getTileDistance(b, referenceTile);
    if (distanceDelta !== 0) {
      return distanceDelta;
    }
    // Deterministic tie-break for equal-distance tiles.
    if (a.y !== b.y) {
      return a.y - b.y;
    }
    return a.x - b.x;
  }

  /**
   * Samples the existing index once for actors with a RepresentableComponent, including their full footprints.
   */
  private getOccupiedTilesByActors(): Set<string> {
    const occupiedTiles = new Set<string>();

    const actorsWithRepresentable = this.actorIndex()
      .getAllIdActors()
      .filter((child) => getActorComponent(child, RepresentableComponent));
    for (const actor of actorsWithRepresentable) {
      const tiles = getTileCoordsUnderObject(this.tilemap, actor);
      tiles.forEach(({ x, y }) => {
        occupiedTiles.add(`${x},${y}`);
      });
    }

    return occupiedTiles;
  }

  /**
   * Finds the closest unoccupied and navigable tile to the given tile position that is also reachable via pathfinding.
   * Unoccupied means no actor sits on the tile (regardless of collider).
   * Similar to randomTileInNavigableRadius but returns the closest reachable unoccupied tile instead of random.
   */
  public async getClosestUnoccupiedTile(
    targetTile: Vector2Simple,
    maxRadius: number = 10,
    terrainType: MovementTerrainType = MovementTerrainType.Ground
  ): Promise<Vector2Simple | undefined> {
    const occupiedTiles = this.getOccupiedTilesByActors();

    // First check if the target tile itself is unoccupied and navigable
    if (
      this.navigation.isWithinGridBounds(targetTile, terrainType) &&
      this.navigation.isTileNavigable(targetTile, terrainType) &&
      !occupiedTiles.has(`${targetTile.x},${targetTile.y}`)
    ) {
      return targetTile; // Target tile is perfect, return it immediately
    }

    // Start from radius 1 and expand outward since radius 0 (target tile) was already checked
    for (let radius = 1; radius <= maxRadius; radius++) {
      const candidateTiles: Vector2Simple[] = [];

      // Get all tiles in current radius ring
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          // Only check tiles on the edge of the current radius (Manhattan distance)
          if (Math.abs(dx) + Math.abs(dy) !== radius) continue;

          const candidate = { x: targetTile.x + dx, y: targetTile.y + dy };

          // Check if tile is within bounds, navigable, and unoccupied
          if (
            this.navigation.isWithinGridBounds(candidate, terrainType) &&
            this.navigation.isTileNavigable(candidate, terrainType) &&
            !occupiedTiles.has(`${candidate.x},${candidate.y}`)
          ) {
            candidateTiles.push(candidate);
          }
        }
      }

      if (candidateTiles.length > 0) {
        // Sort by Euclidean distance
        candidateTiles.sort((a, b) => this.compareTilesByDistanceThenCoordinates(a, b, targetTile));

        // Test each candidate tile for pathfinding reachability
        for (const candidate of candidateTiles) {
          const path = await this.findPathForTerrain(targetTile, candidate, terrainType);
          if (path) {
            // Calculate actual path length to ensure it's within radius
            const pathLength = path.reduce((sum, node, index) => {
              const previousNode = index === 0 ? targetTile : path[index - 1];
              if (!previousNode) return sum;
              const dx = Math.abs(node.x - previousNode.x);
              const dy = Math.abs(node.y - previousNode.y);
              // If diagonal movement is allowed, count diagonal steps as 1.414 tiles (approximate square root of 2)
              const diagonalCost = Math.sqrt(2);
              const distance = dx + dy + (dx * dy === 1 ? diagonalCost - 2 : 0);
              return sum + distance;
            }, 0);

            if (path.length > 0 && pathLength <= maxRadius) {
              return candidate; // Found reachable unoccupied tile within radius
            }
          }
        }
      }
    }

    return undefined;
  }

  /**
   * Finds the unoccupied and navigable tile around the given game object.
   * Searches in expanding radii up to maxRange for a truly free tile.
   * Prefers tiles with higher y (bottom) and higher x (right), or towards targetTile if provided.
   * Returns undefined when no free candidate exists within maxRange.
   */
  public getSpawnPointAroundGameObject(
    gameObject: GameObjects.GameObject,
    maxRange: number = 10,
    targetTile?: Vector2Simple
  ): Vector2Simple | undefined {
    // Compute footprint bounds
    const tiles = getTileCoordsUnderObject(this.tilemap, gameObject);
    if (tiles.length === 0) return undefined;

    const minX = Math.min(...tiles.map((t) => t.x));
    const maxX = Math.max(...tiles.map((t) => t.x));
    const minY = Math.min(...tiles.map((t) => t.y));
    const maxY = Math.max(...tiles.map((t) => t.y));

    const occupied = this.getOccupiedTilesByActors();

    // Try progressively larger radii
    for (let radius = 0; radius <= maxRange; radius++) {
      const candidates: Vector2Simple[] = [];

      const expandedMinX = minX - (radius === 0 ? 1 : radius);
      const expandedMaxX = maxX + (radius === 0 ? 1 : radius);
      const expandedMinY = minY - (radius === 0 ? 1 : radius);
      const expandedMaxY = maxY + (radius === 0 ? 1 : radius);

      // Collect all tiles in the perimeter of the current radius
      for (let y = expandedMinY; y <= expandedMaxY; y++) {
        for (let x = expandedMinX; x <= expandedMaxX; x++) {
          // Skip tiles that are inside the object's footprint
          if (radius === 0) {
            // Include only the immediate surrounding tiles
            if (x >= minX && x <= maxX && y >= minY && y <= maxY) continue;
          } else {
            // For larger radii, only include perimeter tiles
            const isPerimeter = x === expandedMinX || x === expandedMaxX || y === expandedMinY || y === expandedMaxY;
            if (!isPerimeter) continue;
          }

          candidates.push({ x, y });
        }
      }

      // Sort candidates: prefer direction towards targetTile if provided, otherwise by position
      if (targetTile) {
        // Sort by distance to targetTile (closest first)
        candidates.sort((a, b) => {
          return this.compareTilesByDistanceThenCoordinates(a, b, targetTile);
        });
      } else {
        // Sort by y descending (higher y first), then by x descending (higher x first)
        candidates.sort((a, b) => {
          if (a.y !== b.y) return b.y - a.y; // Higher y first
          return b.x - a.x; // Higher x first
        });
      }

      // Check candidates for this radius
      const allowOccupied = radius > maxRange;
      for (const c of candidates) {
        if (!this.navigation.isWithinGridBounds(c)) continue;
        if (!this.navigation.isTileNavigable(c)) continue;
        if (!allowOccupied && occupied.has(`${c.x},${c.y}`)) continue;
        return c;
      }
    }

    return undefined;
  }
}
