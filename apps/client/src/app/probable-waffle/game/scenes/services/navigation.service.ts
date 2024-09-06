import { js as EasyStar } from "easystarjs";
import { Vector2Simple } from "@fuzzy-waddle/api-interfaces";
import Phaser from "phaser";
import { getActorComponent } from "../../data/actor-component";
import { WalkableComponent } from "../../entity/actor/components/walkable-component";
import { ColliderComponent } from "../../entity/actor/components/collider-component";
import { getCenterTileCoordUnderObject, getTileCoordsUnderObject } from "../../library/tile-under-object";
import { drawDebugPath } from "../../debug/debug-path";
import { Pathfinder } from "../../world/map/pathfinder";
import { drawDebugPoint } from "../../debug/debug-point";
import { getSceneComponent } from "../components/scene-component-helpers";
import { TilemapComponent } from "../components/tilemap.component";

export class NavigationService {
  private easyStar: EasyStar;
  private grid: number[][] = [];
  private tilemapGrid: number[][] = [];
  private readonly DEBUG = false;
  private readonly DEBUG_DEMO = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly tilemap: Phaser.Tilemaps.Tilemap
  ) {
    this.extractTilemapGrid();

    this.scene.events.on("updateNavigation", this.updateNavigation, this);
    this.easyStar = new EasyStar();

    this.updateNavigation();

    if (this.DEBUG_DEMO) {
      try {
        this.find({ x: 33, y: 33 }, { x: 5, y: 10 });
        this.debugNavigableRadius();
      } catch (e) {
        console.error("debug navigation", e);
      }
    }
  }

  drawDebugPath(path: Vector2Simple[]) {
    drawDebugPath(this.scene, this.tilemap, path);
  }

  private async debugNavigableRadius() {
    const findAndDebugDrawRandomTileInNavigableRadius = async () => {
      const randomTile = await this.randomTileInNavigableRadius({ x: 33, y: 30 }, 15);
      if (!randomTile) return;
      console.log("RANDOM TILE", randomTile);
      const tileWorldXY = Pathfinder.getTileWorldCenter(this.tilemap, randomTile)!;
      drawDebugPoint(this.scene, tileWorldXY, 0x0000ff);
    };

    for (let i = 0; i < 200; i++) {
      findAndDebugDrawRandomTileInNavigableRadius();
    }
  }

  getTileWorldCenter(tile: Vector2Simple): Vector2Simple | undefined {
    return Pathfinder.getTileWorldCenter(this.tilemap, tile);
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

  private async find(fromTileXY: Vector2Simple, toTileXY: Vector2Simple): Promise<Vector2Simple[]> {
    return new Promise((resolve, reject) => {
      this.easyStar.findPath(fromTileXY.x, fromTileXY.y, toTileXY.x, toTileXY.y, (path) => {
        if (!path) {
          // console.log("Path was not found.");
          reject("Path was not found.");
        } else {
          if (path.length === 0) {
            resolve([]);
            return;
          }

          if (this.DEBUG) {
            this.drawDebugPath(path);
          }
          resolve(path);
        }
      });
      this.easyStar.calculate();
    });
  }

  private extractTilemapGrid() {
    const tileMapComponent = getSceneComponent(this.scene, TilemapComponent);
    if (!tileMapComponent) throw new Error("TilemapComponent not found");
    const data = tileMapComponent.data;
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
      const tilesUnderObject = getTileCoordsUnderObject(this.tilemap, child);
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
      const tilesUnderObject: Vector2Simple[] = getTileCoordsUnderObject(this.tilemap, child);
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

  /**
   * Uses navigation grid to find a random tile that can be navigated to from the current tile within the radius
   */
  public async randomTileInNavigableRadius(
    currentTile: Vector2Simple,
    radiusTiles: number
  ): Promise<Vector2Simple | undefined> {
    // 1. Get a list of valid tile coordinates within the radius
    const validTiles = this.validTilesInRadius(currentTile, radiusTiles);

    // 2. Ensure there are valid tiles within the radius
    if (validTiles.length === 0) {
      return;
    }

    // 3. Randomly pick tiles until a reachable one within the radius is found
    let attempts = 0;
    const maxAttempts = validTiles.length; // Limit attempts to prevent infinite loops
    while (attempts < maxAttempts) {
      const randomIndex = Math.floor(Math.random() * validTiles.length);
      const tile = validTiles[randomIndex];

      // Check path to the random tile
      let path: Vector2Simple[] = [];
      try {
        path = await this.find(currentTile, tile);
      } catch (e) {
        //
      }

      // Calculate path length based on XY distances:
      const sumPathLengthByXY = path.reduce((sum, node, index) => {
        const previousNode = index === 0 ? currentTile : path[index - 1]; // Use currentTile as the "previous" for the first node
        const dx = Math.abs(node.x - previousNode.x);
        const dy = Math.abs(node.y - previousNode.y);
        // If diagonal movement is allowed, count diagonal steps as 1.414 tiles (approximate square root of 2)
        const diagonalCost = Math.sqrt(2); // Precalculate for efficiency
        const distance = dx + dy + (dx * dy === 1 ? diagonalCost - 2 : 0);
        return sum + distance;
      }, 0);

      if (path.length > 0 && sumPathLengthByXY <= radiusTiles) {
        return tile; // Reachable tile within radius found, return it
      }

      attempts++;
      validTiles.splice(randomIndex, 1); // Remove non-reachable or out-of-radius tile
    }

    // all attempts failed
    return;
  }

  public randomTileInRadius(currentTile: Vector2Simple, radiusTiles: number): Vector2Simple | undefined {
    // 1. Get a list of valid tile coordinates within the radius
    const validTiles = this.validTilesInRadius(currentTile, radiusTiles);

    // 2. Ensure there are valid tiles within the radius
    if (validTiles.length === 0) {
      return;
    }

    // 3. Randomly pick tiles until a reachable one within the radius is found
    const randomIndex = Math.floor(Math.random() * validTiles.length);
    return validTiles[randomIndex];
  }

  private validTilesInRadius(currentTile: Vector2Simple, radiusTiles: number): Vector2Simple[] {
    // 1. Get a list of valid tile coordinates within the radius
    const validTiles: Vector2Simple[] = [];
    for (let y = currentTile.y - radiusTiles; y <= currentTile.y + radiusTiles; y++) {
      for (let x = currentTile.x - radiusTiles; x <= currentTile.x + radiusTiles; x++) {
        // Ensure coordinates are within grid bounds
        if (0 <= x && x < this.grid[0].length && 0 <= y && y < this.grid.length) {
          validTiles.push({ x, y });
        }
      }
    }

    return validTiles;
  }

  getPath(gameObject: Phaser.GameObjects.GameObject, toTileXY: Vector2Simple): Promise<Vector2Simple[]> {
    const currentTile = getCenterTileCoordUnderObject(this.tilemap, gameObject);
    if (!currentTile) return Promise.resolve([]);
    try {
      return this.find(currentTile, toTileXY);
    } catch (e) {
      return Promise.resolve([]);
    }
  }

  getCenterTileCoordUnderObject(gameObject: Phaser.GameObjects.GameObject): Vector2Simple | undefined {
    return getCenterTileCoordUnderObject(this.tilemap, gameObject);
  }
}
