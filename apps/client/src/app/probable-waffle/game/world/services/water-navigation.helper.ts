import { js as EasyStar } from "easystarjs";
import type { Vector2Simple } from "@fuzzy-waddle/api-interfaces";
import { TerrainGridBuilder } from "./terrain-grid-builder";

/**
 * Handles pathfinding and tile queries exclusively for water-terrain units.
 * Owns a separate EasyStar instance configured for water tiles only.
 */
export class WaterNavigationHelper {
  private readonly easyStar: EasyStar;
  private waterGrid: number[][] = [];
  private pathCache = new Map<string, { path: Vector2Simple[] | null; timestamp: number }>();
  private readonly CACHE_TTL_MS = 1000;
  /** Cost multiplier applied to shore-adjacent tiles so ships prefer open water. */
  private static readonly SHORE_COST = 8;

  constructor() {
    this.easyStar = new EasyStar();
  }

  setup(tileData: Phaser.Tilemaps.Tile[][]): void {
    this.waterGrid = TerrainGridBuilder.buildWaterGrid(tileData);
    this.easyStar.setGrid(this.waterGrid);
    // Accept both deep water (0) and shore tiles (2); shore is costly to discourage coast-hugging
    this.easyStar.setAcceptableTiles([0, TerrainGridBuilder.SHORE_TILE]);
    this.easyStar.setTileCost(TerrainGridBuilder.SHORE_TILE, WaterNavigationHelper.SHORE_COST);
    this.easyStar.enableDiagonals();
    this.pathCache.clear();
  }

  findPath(from: Vector2Simple, to: Vector2Simple): Promise<Vector2Simple[] | null> {
    const key = `${from.x},${from.y}->${to.x},${to.y}`;
    const now = performance.now();
    const cached = this.pathCache.get(key);
    if (cached && now - cached.timestamp < this.CACHE_TTL_MS) return Promise.resolve(cached.path);

    return new Promise((resolve) => {
      this.easyStar.findPath(from.x, from.y, to.x, to.y, (path) => {
        const result = !path ? null : path.length === 0 ? [] : path;
        this.pathCache.set(key, { path: result, timestamp: now });
        if (this.pathCache.size > 500) this.cleanCache(now);
        resolve(result);
      });
      this.easyStar.calculate();
    });
  }

  isTileWalkable(tile: Vector2Simple): boolean {
    const val = this.waterGrid[tile.y]?.[tile.x];
    // Both deep water (0) and shore tiles (2) are navigable
    return val === 0 || val === TerrainGridBuilder.SHORE_TILE;
  }

  isWithinBounds(tile: Vector2Simple): boolean {
    const firstRow = this.waterGrid[0];
    if (!firstRow) return false;
    return tile.x >= 0 && tile.x < firstRow.length && tile.y >= 0 && tile.y < this.waterGrid.length;
  }

  getWalkableTilesInRadius(center: Vector2Simple, radius: number): Vector2Simple[] {
    const tiles: Vector2Simple[] = [];
    for (let y = center.y - radius; y <= center.y + radius; y++) {
      for (let x = center.x - radius; x <= center.x + radius; x++) {
        const tile = { x, y };
        if (this.isWithinBounds(tile) && this.isTileWalkable(tile)) {
          tiles.push(tile);
        }
      }
    }
    return tiles;
  }

  /**
   * BFS outward from a starting tile to find the nearest water tile.
   * Used when spawning water units from a land building.
   */
  findNearestWaterTile(from: Vector2Simple, maxRadius = 30): Vector2Simple | null {
    for (let radius = 0; radius <= maxRadius; radius++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          if (Math.abs(dx) + Math.abs(dy) !== radius) continue;
          const candidate = { x: from.x + dx, y: from.y + dy };
          if (this.isWithinBounds(candidate) && this.isTileWalkable(candidate)) {
            return candidate;
          }
        }
      }
    }
    return null;
  }

  clearCache(): void {
    this.pathCache.clear();
  }

  private cleanCache(now: number): void {
    for (const [key, value] of this.pathCache.entries()) {
      if (now - value.timestamp >= this.CACHE_TTL_MS) this.pathCache.delete(key);
    }
  }
}
