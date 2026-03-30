import { TerrainType } from "./navigation.service";

/**
 * Builds per-terrain-category navigation grids from Phaser tilemap data.
 * 0 = walkable, 1 = blocked (EasyStar convention).
 */
export class TerrainGridBuilder {
  /**
   * Ground grid: blocked by navigationRestriction tiles OR water terrain.
   * This is the default grid for land units.
   */
  static buildGroundGrid(tileData: Phaser.Tilemaps.Tile[][]): number[][] {
    return tileData.map((row) =>
      row.map((tile) => {
        if (tile.properties.navigationRestriction) return 1;
        if (tile.properties.terrainType === TerrainType.Water) return 1;
        return 0;
      })
    );
  }

  /**
   * Water grid: only water terrain tiles are walkable.
   * Land tiles and navigationRestriction tiles are blocked.
   * Shore tiles (water adjacent to land) are marked with value 2 to discourage
   * ships from hugging the coastline — EasyStar applies a high cost to them.
   */
  static buildWaterGrid(tileData: Phaser.Tilemaps.Tile[][]): number[][] {
    // First pass: basic water (0) / land (1) grid
    const base = tileData.map((row) =>
      row.map((tile) => {
        if (tile.properties.terrainType === TerrainType.Water) return 0;
        return 1;
      })
    );

    const rows = base.length;

    // Second pass: mark water tiles adjacent to land as shore tiles (value 2)
    return base.map((row, y) =>
      row.map((cell, x) => {
        if (cell !== 0) return cell; // Not a water tile — keep as blocked
        // Check all 8 neighbours; if any is land, this is a shore tile
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < rows && nx >= 0 && nx < (base[ny]?.length ?? 0)) {
              if (base[ny]![nx] === 1) return TerrainGridBuilder.SHORE_TILE;
            }
          }
        }
        return 0; // Deep water
      })
    );
  }

  /** Tile value used for water tiles adjacent to land (shore). */
  static readonly SHORE_TILE = 2;

  static isWaterTile(tile: Phaser.Tilemaps.Tile): boolean {
    return tile.properties.terrainType === TerrainType.Water;
  }
}
