import { js as EasyStar } from "easystarjs";
import { Vector2Simple } from "@fuzzy-waddle/api-interfaces";
import Phaser from "phaser";
import { getActorComponent } from "../../data/actor-component";
import { WalkableComponent } from "../../entity/actor/components/walkable-component";
import { ColliderComponent } from "../../entity/actor/components/collider-component";
import { getCenterTileCoordUnderObject, getTileCoordsUnderObject } from "../../library/tile-under-object";
import { drawDebugPath } from "../../debug/debug-path";
import { Pathfinder_old } from "../../world/map/pathfinder_old";
import { drawDebugPoint } from "../../debug/debug-point";
import { getSceneComponent } from "../components/scene-component-helpers";
import { TilemapComponent } from "../components/tilemap.component";
import { onSceneInitialized } from "../../data/game-object-helper";
import { throttle } from "../../library/throttle";

export enum TerrainType {
  Grass = "grass",
  Gravel = "gravel",
  Water = "water",
  Sand = "sand",
  Snow = "snow",
  Stone = "stone"
}

export class NavigationService {
  private readonly terrainTypes = Object.values(TerrainType);
  static UpdateNavigationEvent = "updateNavigation";
  private easyStar: EasyStar;
  private grid: number[][] = [];
  private tilemapGrid: number[][] = [];
  private readonly DEBUG = false;
  private readonly DEBUG_DEMO = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly tilemap: Phaser.Tilemaps.Tilemap
  ) {
    this.scene.events.on(NavigationService.UpdateNavigationEvent, this.throttleUpdateNavigation, this);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.easyStar = new EasyStar();
    onSceneInitialized(scene, this.init, this);
  }

  private init() {
    this.extractTilemapGrid();

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
      const tileWorldXY = Pathfinder_old.getTileWorldCenter(this.tilemap, randomTile)!;
      drawDebugPoint(this.scene, tileWorldXY, 0x0000ff);
    };

    for (let i = 0; i < 200; i++) {
      // noinspection ES6MissingAwait
      findAndDebugDrawRandomTileInNavigableRadius();
    }
  }

  getTileWorldCenter(tile: Vector2Simple): Vector2Simple | undefined {
    return Pathfinder_old.getTileWorldCenter(this.tilemap, tile);
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

  private throttleUpdateNavigation = throttle(this.updateNavigation.bind(this), 100);

  private updateNavigation() {
    this.setup();
  }

  /**
   * Uses navigation grid to find a random tile that can be navigated to from the current tile within the radius of current tile
   */
  async randomTileInNavigableRadius(
    currentTile: Vector2Simple,
    radiusFromCurrentTile: number
  ): Promise<Vector2Simple | undefined> {
    // 1. Get a list of valid tile coordinates within the radius
    const validTiles = this.validTilesInRadiusOfCurrentTile(currentTile, radiusFromCurrentTile, true);

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

      if (path.length > 0 && sumPathLengthByXY <= radiusFromCurrentTile) {
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
    const validTiles = this.validTilesInRadiusOfCurrentTile(currentTile, radiusTiles, true);

    // 2. Ensure there are valid tiles within the radius
    if (validTiles.length === 0) {
      return;
    }

    // 3. Randomly pick tiles until a reachable one within the radius is found
    const randomIndex = Math.floor(Math.random() * validTiles.length);
    return validTiles[randomIndex];
  }

  /**
   * respects blocked tiles under object plus radius around them
   */
  public closestWalkableTileBetweenGameObjectsInRadius(
    gameObject: Phaser.GameObjects.GameObject,
    destinationGameObject: Phaser.GameObjects.GameObject,
    radiusTiles?: number
  ): Vector2Simple | undefined {
    const fromTile = getCenterTileCoordUnderObject(this.tilemap, gameObject);
    if (!fromTile) return undefined;

    // Step 1: Get blocked tiles (occupied by the destination object)
    const blockedTiles = getTileCoordsUnderObject(this.tilemap, destinationGameObject);

    // Step 2: Find the closest walkable tile around the blocked tiles within the radius
    // noinspection UnnecessaryLocalVariableJS
    const closestWalkableTile = this.getClosestWalkableTileAroundBlockedTilesInRadius(
      fromTile,
      blockedTiles,
      radiusTiles
    );

    return closestWalkableTile; // Return the closest walkable tile if found, or undefined
  }

  /**
   * Doesn't respect blocked tiles under object
   */
  private validTilesInRadiusOfCurrentTile(
    currentTile: Vector2Simple,
    radiusTiles: number,
    walkable: boolean = false
  ): Vector2Simple[] {
    // 1. Get a list of valid tile coordinates within the radius
    const validTiles: Vector2Simple[] = [];
    for (let y = currentTile.y - radiusTiles; y <= currentTile.y + radiusTiles; y++) {
      for (let x = currentTile.x - radiusTiles; x <= currentTile.x + radiusTiles; x++) {
        // Ensure coordinates are within grid bounds
        if (0 <= x && x < this.grid[0].length && 0 <= y && y < this.grid.length) {
          if (walkable) {
            if (this.grid[y][x] === 0) {
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

  /**
   * Returns a path from the current tile under the gameObject to the target tile
   */
  findAndUsePathFromGameObjectToTile(
    gameObject: Phaser.GameObjects.GameObject,
    toTileXY: Vector2Simple
  ): Promise<Vector2Simple[]> {
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

  /**
   * Finds a path from the gameObject to the targetGameObject within the specified radius.
   * Respects blocked tiles under the targetGameObject.
   */
  public async findAndUseWalkablePathBetweenGameObjectsWithRadius(
    gameObject: Phaser.GameObjects.GameObject,
    targetGameObject: Phaser.GameObjects.GameObject,
    radiusTiles?: number
  ): Promise<Vector2Simple[]> {
    const fromTile = getCenterTileCoordUnderObject(this.tilemap, gameObject);
    if (!fromTile) return Promise.resolve([]);

    // Step 2: Find the closest walkable tile around the building within the radius
    const closestWalkableTile = this.closestWalkableTileBetweenGameObjectsInRadius(
      gameObject,
      targetGameObject,
      radiusTiles
    );

    if (!closestWalkableTile) {
      return []; // Return an empty array if no walkable tile was found
    }

    // Step 3: Use EasyStar to find the path to the closest walkable tile
    try {
      return await this.find(fromTile, closestWalkableTile);
    } catch (e) {
      return []; // Return an empty array if no path was found
    }
  }

  private getClosestWalkableTileAroundBlockedTilesInRadius(
    fromTile: Vector2Simple,
    blockedTiles: Vector2Simple[],
    radiusTiles: number = 2 // Default radius if not specified
  ): Vector2Simple | undefined {
    const walkableTiles: Set<string> = new Set(); // Use Set to avoid duplicates

    // Step 1: Loop through each blocked tile
    blockedTiles.forEach((blockedTile) => {
      // Loop through the surrounding tiles within the specified radius
      for (let dx = -radiusTiles; dx <= radiusTiles; dx++) {
        for (let dy = -radiusTiles; dy <= radiusTiles; dy++) {
          // Calculate the neighboring tile coordinates
          const neighbor: Vector2Simple = { x: blockedTile.x + dx, y: blockedTile.y + dy };

          // Check if the neighbor is within grid bounds, walkable, and within radius
          if (
            this.isWithinGridBounds(neighbor) && // Ensure it's within grid bounds
            this.isTileWalkable(neighbor) &&
            Math.abs(dx) + Math.abs(dy) <= radiusTiles // Use Manhattan distance
          ) {
            // Use a string representation to store the tile in the Set
            walkableTiles.add(`${neighbor.x},${neighbor.y}`);
          }
        }
      }
    });

    // Convert Set to an array of Vector2Simple
    const walkableTilesArray = Array.from(walkableTiles).map((tile) => {
      const [x, y] = tile.split(",").map(Number);
      return { x, y };
    });

    // Step 2: Find the closest walkable tile to the fromTile
    if (walkableTilesArray.length === 0) {
      console.warn("No walkable tiles found around the blocked tiles.");
      return undefined;
    }

    // Sort the walkable tiles based on distance to fromTile
    walkableTilesArray.sort((a, b) => this.getTileDistance(a, fromTile) - this.getTileDistance(b, fromTile));

    return walkableTilesArray[0]; // Return the closest tile
  }

  private isWithinGridBounds(tile: Vector2Simple): boolean {
    return tile.x >= 0 && tile.x < this.grid[0].length && tile.y >= 0 && tile.y < this.grid.length;
  }

  private isTileWalkable(tile: Vector2Simple): boolean {
    return this.grid[tile.y][tile.x] === 0; // Check if the tile is walkable (0 means walkable)
  }

  private getTileDistance(tile1: Vector2Simple, tile2: Vector2Simple): number {
    const dx = tile1.x - tile2.x;
    const dy = tile1.y - tile2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private destroy() {
    this.scene.events.off(NavigationService.UpdateNavigationEvent, this.throttleUpdateNavigation, this);
  }

  getTerrainUnderActor(gameObject: Phaser.GameObjects.GameObject): TerrainType | undefined {
    const tile = getTileCoordsUnderObject(this.tilemap, gameObject)[0];
    if (!tile) return undefined;
    const tileData = this.tilemap.getTileAt(tile.x, tile.y);
    if (!tileData) return undefined;
    const terrainType = tileData.properties.terrainType;
    if (!terrainType) return undefined;
    if (this.terrainTypes.includes(terrainType)) {
      return terrainType as TerrainType;
    }
    return undefined;
  }
}
