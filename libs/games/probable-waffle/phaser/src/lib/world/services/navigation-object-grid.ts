import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
import type Phaser from "phaser";
import { getActorComponent } from "../../data/actor-component";
import { NavigableComponent } from "../../entity/components/movement/navigable-component";
import { ColliderComponent } from "../../entity/components/movement/collider-component";
import { getTileCoordsUnderObject } from "../../library/tile-under-object";

/** Builds the existing collider overlay, then applies navigable footprints in native order. */
export class NavigationObjectGrid {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly tilemap: Phaser.Tilemaps.Tilemap,
    private readonly DEBUG: boolean
  ) {}

  /**
   * Undefined by default
   * 0 for navigable
   * 1 for blocked
   */
  build(tilemapGrid: number[][]): (number | undefined)[][] {
    const emptyGrid: (number | undefined)[][] = tilemapGrid.map((row) => row.map(() => undefined));

    const tileIndexesUnderColliders = this.getTileIndexesUnderColliders();
    const actualTilesUnderColliders = tileIndexesUnderColliders.map((tileIndex) =>
      this.tilemap.getTileAt(tileIndex.x, tileIndex.y)
    );
    // tint tiles to red
    actualTilesUnderColliders.forEach((tile) => {
      if (!tile) return;
      if (this.DEBUG) tile.tint = 0xff0000;
      this.setObjectGridTile(emptyGrid, tile, 1);
    });

    const navigables = this.getTileIndexesForNavigables();
    const actualNavigableTiles = navigables.map((tileIndex) => this.tilemap.getTileAt(tileIndex.x, tileIndex.y));
    // tint tiles to green
    actualNavigableTiles.forEach((tile) => {
      if (!tile) return;
      if (this.DEBUG) tile.tint = 0x00ff00;
      this.setObjectGridTile(emptyGrid, tile, 0);
    });

    return emptyGrid;
  }

  private setObjectGridTile(objectGrid: (number | undefined)[][], tile: Phaser.Tilemaps.Tile, value: number): void {
    const row = objectGrid[tile.y];
    if (!row || tile.x < 0 || tile.x >= row.length) return;
    row[tile.x] = value;
  }

  /**
   * Returns all tile indexes under colliders
   */
  private getTileIndexesUnderColliders(): Vector2Simple[] {
    const colliders: Vector2Simple[] = [];
    this.scene.children.each((child) => {
      const colliderComponent = getActorComponent(child, ColliderComponent);
      if (!colliderComponent) return;
      if (!colliderComponent.colliderDefinition?.enabled) return;
      const tilesUnderObject = getTileCoordsUnderObject(this.tilemap, child);
      colliders.push(...tilesUnderObject);
    });
    return colliders;
  }

  /**
   * Returns all tile indexes under navigables (bridge, stairs, etc.)
   */
  private getTileIndexesForNavigables(): Vector2Simple[] {
    const navigables: Vector2Simple[] = [];
    this.scene.children.each((child) => {
      const navigableComponent = getActorComponent(child, NavigableComponent);
      if (!navigableComponent) return;
      const tilesUnderObject: Vector2Simple[] = getTileCoordsUnderObject(this.tilemap, child);
      if (tilesUnderObject.length === 0) return;
      const { shrinkX, shrinkY } = NavigableComponent.handleNavigable(child);

      const minX = Math.min(...tilesUnderObject.map((tile) => tile.x));
      const maxX = Math.max(...tilesUnderObject.map((tile) => tile.x));
      const minY = Math.min(...tilesUnderObject.map((tile) => tile.y));
      const maxY = Math.max(...tilesUnderObject.map((tile) => tile.y));
      const shrinkedTiles = tilesUnderObject.filter((tile) => {
        const x = tile.x;
        const y = tile.y;
        const isShrinkedX = x >= minX + shrinkX && x <= maxX - shrinkX;
        const isShrinkedY = y >= minY + shrinkY && y <= maxY - shrinkY;
        return isShrinkedX && isShrinkedY;
      });

      navigables.push(...shrinkedTiles);
    });
    return navigables;
  }
}
