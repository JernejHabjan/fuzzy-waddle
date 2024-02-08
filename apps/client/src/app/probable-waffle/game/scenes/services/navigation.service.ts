import EasyStar from "easystarjs";
import { Vector2Simple } from "@fuzzy-waddle/api-interfaces";
import Phaser from "phaser";
import { getActorComponent } from "../../data/actor-component";
import { WalkableComponent } from "../../entity/actor/components/walkable-component";
import { ColliderComponent } from "../../entity/actor/components/collider-component";
import { getTileIndexesUnderObject } from "../../library/tile-under-object";
import { drawDebugPath } from "../../debug/debug-path";

export class NavigationService {
  private easyStar: EasyStar.js;
  private grid: number[][] = [];
  private tilemapGrid: number[][] = [];
  private readonly DEBUG = true;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly tilemap: Phaser.Tilemaps.Tilemap
  ) {
    this.extractTilemapGrid();

    this.scene.events.on("updateNavigation", this.updateNavigation, this);
    this.easyStar = new EasyStar.js();

    this.updateNavigation();

    this.find({ x: 33, y: 33 }, { x: 5, y: 10 }); // todo for test
  }

  private setup() {
    const objectsGrid = this.extractGridFromObjects();
    this.grid = this.tilemapGrid.map((row, i) =>
      row.map((tile, j) => {
        const objectValue = objectsGrid[i][j];
        if (objectValue === 0) return 0; // walkable object
        if (objectValue === 1) return 1; // blocked by object
        return tile; // tilemap grid
      })
    );
    this.setupNavigation();
  }

  private async find(from: Vector2Simple, to: Vector2Simple): Promise<Vector2Simple[]> {
    return new Promise((resolve, reject) => {
      this.easyStar.findPath(from.x, from.y, to.x, to.y, (path) => {
        if (!path) {
          console.log("Path was not found.");
          reject("Path was not found.");
        } else {
          if (path.length === 0) {
            resolve([]);
            return;
          }

          if (this.DEBUG) {
            drawDebugPath(this.scene, this.tilemap, path);
          }
          resolve(path);
        }
      });
      this.easyStar.calculate();
    });
  }

  private extractTilemapGrid() {
    const data = this.tilemap.layers[0].data;
    const grid: number[][] = [];
    data.forEach((row) => {
      const newRow: number[] = [];
      row.forEach((tile) => {
        newRow.push(tile.properties.navigationRestriction ? 1 : 0);
      });
      grid.push(newRow);
    });
    this.tilemapGrid = grid;
  }

  /**
   * Undefined by default
   * 0 for walkable
   * 1 for blocked
   */
  private extractGridFromObjects(): (number | undefined)[][] {
    const emptyGrid: (number | undefined)[][] = this.tilemapGrid.map((row) => row.map(() => undefined));

    const tileIndexesUnderColliders = this.getTileIndexesUnderColliders();
    const actualTilesUnderColliders = tileIndexesUnderColliders.map((tileIndex) =>
      this.tilemap.getTileAt(tileIndex.x, tileIndex.y)
    );
    // tint tiles to red
    actualTilesUnderColliders.forEach((tile) => {
      if (!tile) return;
      if (this.DEBUG) tile.tint = 0xff0000;
      emptyGrid[tile.y][tile.x] = 1;
    });

    const walkables = this.getTileIndexesForWalkables();
    const actualWalkableTiles = walkables.map((tileIndex) => this.tilemap.getTileAt(tileIndex.x, tileIndex.y));
    // tint tiles to green
    actualWalkableTiles.forEach((tile) => {
      if (!tile) return;
      if (this.DEBUG) tile.tint = 0x00ff00;
      emptyGrid[tile.y][tile.x] = 0;
    });

    return emptyGrid;
  }

  /**
   * Returns all tile indexes under colliders
   */
  private getTileIndexesUnderColliders(): Vector2Simple[] {
    const colliders: Vector2Simple[] = [];
    this.scene.children.each((child) => {
      const colliderComponent = getActorComponent(child, ColliderComponent);
      if (!colliderComponent) return;
      const tilesUnderObject = getTileIndexesUnderObject(this.tilemap, child);
      colliders.push(...tilesUnderObject);
    });
    return colliders;
  }

  /**
   * Returns all tile indexes under walkables (bridge, stairs, etc.)
   */
  private getTileIndexesForWalkables(): Vector2Simple[] {
    const walkables: Vector2Simple[] = [];
    this.scene.children.each((child) => {
      const walkableComponent = getActorComponent(child, WalkableComponent);
      if (!walkableComponent) return;
      const tilesUnderObject: Vector2Simple[] = getTileIndexesUnderObject(this.tilemap, child);
      const { shrinkX, shrinkY } = WalkableComponent.handleWalkable(child);

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

      walkables.push(...shrinkedTiles);
    });
    return walkables;
  }

  private setupNavigation() {
    this.easyStar.setGrid(this.grid);
    this.easyStar.setAcceptableTiles([0]);
    this.easyStar.enableDiagonals();
  }

  private updateNavigation() {
    this.setup();
  }
}
