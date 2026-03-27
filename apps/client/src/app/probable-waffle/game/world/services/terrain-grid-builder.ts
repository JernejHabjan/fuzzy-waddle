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
   */
  static buildWaterGrid(tileData: Phaser.Tilemaps.Tile[][]): number[][] {
    return tileData.map((row) =>
      row.map((tile) => {
        if (tile.properties.terrainType === TerrainType.Water) return 0;
        return 1;
      })
    );
  }

  static isWaterTile(tile: Phaser.Tilemaps.Tile): boolean {
    return tile.properties.terrainType === TerrainType.Water;
  }
}
