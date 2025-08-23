import {
  BOTTOM,
  BOTTOM_LEFT,
  BOTTOM_RIGHT,
  Direction,
  js as EasyStar,
  LEFT,
  RIGHT,
  TOP,
  TOP_LEFT,
  TOP_RIGHT
} from "easystarjs";
import { Vector2Simple } from "@fuzzy-waddle/api-interfaces";
import Phaser from "phaser";
import { getActorComponent } from "../../data/actor-component";
import {
  WalkableComponent,
  WalkablePath,
  WalkablePathDirection
} from "../../entity/actor/components/walkable-component";
import { ColliderComponent } from "../../entity/actor/components/collider-component";
import { getCenterTileCoordUnderObject, getTileCoordsUnderObject } from "../../library/tile-under-object";
import { drawDebugPath } from "../../debug/debug-path";
import { Pathfinder_old } from "../../world/map/pathfinder_old";
import { drawDebugPoint } from "../../debug/debug-point";
import { getSceneComponent } from "../components/scene-component-helpers";
import { TilemapComponent } from "../components/tilemap.component";
import { getSelectableGameObject, onSceneInitialized } from "../../data/game-object-helper";
import { throttleWithTrailing } from "../../library/throttle";
import { environment } from "../../../../../environments/environment";
import { RepresentableComponent } from "../../entity/actor/components/representable-component";

export enum TerrainType {
  Grass = "grass",
  Gravel = "gravel",
  Water = "water",
  Sand = "sand",
  Snow = "snow",
  Stone = "stone"
}

// HeightMapCell stores height and walkability info for each tile
interface HeightMapCell {
  walkableHeight: number;
  exitHeight: number;
  acceptMinimumHeight: number;
  isWalkable: boolean;
  walkableComponent?: WalkableComponent;
}

export class NavigationService {
  private readonly terrainTypes = Object.values(TerrainType);
  static UpdateNavigationEvent = "updateNavigation";
  private readonly easyStar: EasyStar;
  private easyStarNavigationGrid: number[][] = [];
  private tilemapGrid: number[][] = [];
  private heightMapGrid: HeightMapCell[][] = [];
  private readonly DEBUG = false;
  private readonly DEBUG_DEMO = false;
  private readonly DEBUG_CLICK_INFO = false;
  private directionalConditions: Map<string, Direction[]> = new Map();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly tilemap: Phaser.Tilemaps.Tilemap
  ) {
    this.scene.events.on(NavigationService.UpdateNavigationEvent, this.throttleUpdateNavigation, this);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.easyStar = new EasyStar();
    onSceneInitialized(scene, this.initNavigationService, this);
  }

  private initNavigationService() {
    this.extractTilemapGrid();

    this.updateNavigation();

    // DEBUG: Bind click listener to print conditional directions and heightMapGrid info
    if (this.DEBUG_CLICK_INFO && !environment.production) {
      this.scene.input.on(
        Phaser.Input.Events.POINTER_UP,
        (pointer: Phaser.Input.Pointer, gameObjectsUnderCursor: Phaser.GameObjects.GameObject[]) => {
          const interactiveObjectIds = gameObjectsUnderCursor
            .map((go) => getSelectableGameObject(go))
            .filter((go) => !!go) as Phaser.GameObjects.GameObject[];
          if (interactiveObjectIds.length === 0) return; // No interactive objects clicked
          const object = interactiveObjectIds[0];
          const tiles = getTileCoordsUnderObject(this.tilemap, object);
          console.log("Clicked GameObject:", object);
          tiles.forEach(({ x, y }) => {
            const heightInfo = this.heightMapGrid[y]?.[x];
            const directions = this.directionalConditions.get(`${x}_${y}`);
            console.log(`Tile (${x},${y}):`, {
              heightInfo,
              conditionalDirections: directions
            });
          });
        }
      );
    }

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
    this.easyStarNavigationGrid = this.tilemapGrid.map((row, i) =>
      row.map((tile, j) => {
        const objectValue = objectsGrid[i][j];
        if (objectValue === 0) return 0; // walkable object
        if (objectValue === 1) return 1; // blocked by object
        return tile; // tilemap easyStarNavigationGrid
      })
    );
    this.extractHeightMapGrid();
    this.setupNavigation();
  }

  // Populate heightMapGrid with info from tilemap and Walkable objects
  private extractHeightMapGrid() {
    // Initialize grid with default values
    this.heightMapGrid = this.tilemapGrid.map((row) =>
      row.map((tile) => ({
        walkableHeight: 0,
        exitHeight: 0,
        acceptMinimumHeight: 0,
        isWalkable: tile === 0
      }))
    );

    const walkableTilesToProcess: { x: number; y: number; walkableComponent: WalkableComponent }[] = [];

    // First pass: Overlay Walkable objects without checking accessibility yet
    this.scene.children.each((child) => {
      const walkableComponent = getActorComponent(child, WalkableComponent);
      if (!walkableComponent) return;
      const tiles = getTileCoordsUnderObject(this.tilemap, child);
      const def = walkableComponent.walkableDefinition;
      tiles.forEach(({ x, y }) => {
        if (!(this.heightMapGrid[y] && this.heightMapGrid[y][x])) return; // Skip if out of bounds
        this.heightMapGrid[y][x] = {
          walkableHeight: def.walkableHeight ?? 0,
          exitHeight: def.exitHeight ?? 0,
          acceptMinimumHeight: def.acceptMinimumHeight ?? 0,
          isWalkable: false, // Assume not walkable until proven otherwise in the second pass
          walkableComponent
        };
        walkableTilesToProcess.push({ x, y, walkableComponent });
      });
    });

    // Second pass: Determine accessibility for all walkable objects
    walkableTilesToProcess.forEach(({ x, y }) => {
      const cell = this.heightMapGrid[y][x];
      const neighborOffsets = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
        { dx: -1, dy: -1 },
        { dx: 1, dy: -1 },
        { dx: -1, dy: 1 },
        { dx: 1, dy: 1 }
      ];
      for (const { dx, dy } of neighborOffsets) {
        const nx = x + dx,
          ny = y + dy;
        if (ny >= 0 && ny < this.heightMapGrid.length && nx >= 0 && nx < this.heightMapGrid[ny].length) {
          const neighbor = this.heightMapGrid[ny][nx];
          // Accessible if neighbor is walkable and can access from neighbor to this tile
          if (this.canAccessFrom(neighbor, cell)) {
            cell.isWalkable = true;
            break;
          }
        }
      }
    });
  }

  private setDirectionalConditions(): void {
    // For each tile, set directional conditions based on heightMapGrid
    this.directionalConditions.clear(); // Clear previous conditions
    for (let y = 0; y < this.heightMapGrid.length; y++) {
      for (let x = 0; x < this.heightMapGrid[y].length; x++) {
        const cell = this.heightMapGrid[y][x];
        if (!cell.isWalkable) continue;
        const allowedDirections: Direction[] = [];

        // Check all 8 directions
        const directions: { dir: Direction; dx: number; dy: number; name: WalkablePathDirection }[] = [
          { dir: TOP, dx: 0, dy: -1, name: WalkablePathDirection.Top },
          { dir: BOTTOM, dx: 0, dy: 1, name: WalkablePathDirection.Bottom },
          { dir: LEFT, dx: -1, dy: 0, name: WalkablePathDirection.Left },
          { dir: RIGHT, dx: 1, dy: 0, name: WalkablePathDirection.Right },
          { dir: TOP_LEFT, dx: -1, dy: -1, name: WalkablePathDirection.TopLeft },
          { dir: TOP_RIGHT, dx: 1, dy: -1, name: WalkablePathDirection.TopRight },
          { dir: BOTTOM_LEFT, dx: -1, dy: 1, name: WalkablePathDirection.BottomLeft },
          { dir: BOTTOM_RIGHT, dx: 1, dy: 1, name: WalkablePathDirection.BottomRight }
        ];

        const checkDirection = (
          dir: Direction,
          dx: number,
          dy: number,
          name: WalkablePathDirection,
          pathDef?: WalkablePath
        ) => {
          const nx = x + dx;
          const ny = y + dy;
          if (ny >= 0 && ny < this.heightMapGrid.length && nx >= 0 && nx < this.heightMapGrid[ny].length) {
            const neighbor = this.heightMapGrid[ny][nx];
            const neighborWalkableComponent = neighbor.walkableComponent;

            // check if we can move from cell to neighbor
            const canMoveToNeighbor = this.canAccessFrom(cell, neighbor);
            // check if we can move from neighbor to cell
            const canMoveFromNeighbor = this.canAccessFrom(neighbor, cell);

            if (!canMoveToNeighbor && !canMoveFromNeighbor) return;

            // if on a walkable component with path restrictions, check them
            if (pathDef && !pathDef[name]) {
              // if neighbor is not a walkable component, we can't move to it if path is restricted
              if (!neighborWalkableComponent) return;

              // if neighbor is a walkable component, check if it allows access from our direction
              const oppositeDirection: WalkablePathDirection | undefined = {
                [WalkablePathDirection.Top]: WalkablePathDirection.Bottom,
                [WalkablePathDirection.Bottom]: WalkablePathDirection.Top,
                [WalkablePathDirection.Left]: WalkablePathDirection.Right,
                [WalkablePathDirection.Right]: WalkablePathDirection.Left,
                [WalkablePathDirection.TopLeft]: WalkablePathDirection.BottomRight,
                [WalkablePathDirection.TopRight]: WalkablePathDirection.BottomLeft,
                [WalkablePathDirection.BottomLeft]: WalkablePathDirection.TopRight,
                [WalkablePathDirection.BottomRight]: WalkablePathDirection.TopLeft
              }[name];
              if (!oppositeDirection || !neighborWalkableComponent.walkablePathDefinition[oppositeDirection]) {
                return;
              }
            }
            allowedDirections.push(dir);
          }
        };

        const walkableComponent = cell.walkableComponent;
        const pathDef = walkableComponent?.walkablePathDefinition;
        const accessibleFromAllSides = walkableComponent?.accessibleFromAllSides ?? true;

        if (walkableComponent && !accessibleFromAllSides) {
          directions.forEach(({ dir, dx, dy, name }) => {
            checkDirection(dir, dx, dy, name, pathDef);
          });
        } else {
          directions.forEach(({ dir, dx, dy, name }) => {
            checkDirection(dir, dx, dy, name);
          });
        }

        this.easyStar.setDirectionalCondition(x, y, allowedDirections);
        if (this.DEBUG_CLICK_INFO && !environment.production) {
          this.directionalConditions.set(`${x}_${y}`, allowedDirections); // Store for debug
        }
      }
    }
  }

  // canAccessFrom: allow access if exitHeight of 'from' >= acceptMinimumHeight of 'to'
  // Or if stairs (walkableHeight < exitHeight) allow access from ground to stairs/wall
  private canAccessFrom(from: HeightMapCell, to: HeightMapCell): boolean {
    // Allow access if exitHeight of 'from' >= acceptMinimumHeight of 'to'
    if (from.exitHeight >= to.acceptMinimumHeight) return true;
    // Stairs logic: allow access from ground to stairs/wall
    // noinspection RedundantIfStatementJS
    if (from.walkableHeight < from.exitHeight && to.walkableHeight >= from.exitHeight) return true;
    return false;
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
    this.easyStar.setGrid(this.easyStarNavigationGrid);
    this.easyStar.setAcceptableTiles([0]);
    this.easyStar.enableDiagonals();
    this.setDirectionalConditions();
  }

  private throttleUpdateNavigation = throttleWithTrailing(this.updateNavigation.bind(this), 100);

  private updateNavigation() {
    this.setup();
  }

  /**
   * Uses navigation easyStarNavigationGrid to find a random tile that can be navigated to from the current tile within the radius of current tile
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

    const isWalkable = !!getActorComponent(destinationGameObject, WalkableComponent);

    let closestWalkableTile;
    if (isWalkable) {
      // no need to find the closest walkable - try to find the tile under the destination object
      // this moves actor ON the wall or tower
      const destinationTile = getCenterTileCoordUnderObject(this.tilemap, destinationGameObject);
      if (!destinationTile) return undefined;
      closestWalkableTile = destinationTile; // Use the tile under the destination object directly
    } else {
      // Step 1: Get blocked tiles (occupied by the destination object)
      const blockedTiles = getTileCoordsUnderObject(this.tilemap, destinationGameObject);

      // Step 2: Find the closest walkable tile around the blocked tiles within the radius
      // noinspection UnnecessaryLocalVariableJS
      closestWalkableTile = this.getClosestWalkableTileAroundBlockedTilesInRadius(fromTile, blockedTiles, radiusTiles);
    }

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
        // Ensure coordinates are within easyStarNavigationGrid bounds
        if (0 <= x && x < this.easyStarNavigationGrid[0].length && 0 <= y && y < this.easyStarNavigationGrid.length) {
          if (walkable) {
            if (this.easyStarNavigationGrid[y][x] === 0) {
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

          // Check if the neighbor is within easyStarNavigationGrid bounds, walkable, and within radius
          if (
            this.isWithinGridBounds(neighbor) && // Ensure it's within easyStarNavigationGrid bounds
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
      // console.warn("No walkable tiles found around the blocked tiles.");
      return undefined;
    }

    // Sort the walkable tiles based on distance to fromTile
    walkableTilesArray.sort((a, b) => this.getTileDistance(a, fromTile) - this.getTileDistance(b, fromTile));

    return walkableTilesArray[0]; // Return the closest tile
  }

  private isWithinGridBounds(tile: Vector2Simple): boolean {
    return (
      tile.x >= 0 &&
      tile.x < this.easyStarNavigationGrid[0].length &&
      tile.y >= 0 &&
      tile.y < this.easyStarNavigationGrid.length
    );
  }

  public isTileWalkable(tile: Vector2Simple): boolean {
    return this.easyStarNavigationGrid[tile.y][tile.x] === 0; // Check if the tile is walkable (0 means walkable)
  }

  isAreaBeneathGameObjectWalkable(gameObject: Phaser.GameObjects.GameObject): boolean {
    const tileIndexesUnderObject = getTileCoordsUnderObject(this.tilemap, gameObject);
    const actualTilesUnderObject = tileIndexesUnderObject.map((tileIndex) =>
      this.tilemap.getTileAt(tileIndex.x, tileIndex.y)
    );
    return actualTilesUnderObject.every((tile) => tile && this.isTileWalkable({ x: tile.x, y: tile.y }));
  }

  private getTileDistance(tile1: Vector2Simple, tile2: Vector2Simple): number {
    const dx = tile1.x - tile2.x;
    const dy = tile1.y - tile2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private destroy() {
    this.scene?.events.off(NavigationService.UpdateNavigationEvent, this.throttleUpdateNavigation, this);
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

  /**
   * Gets all tiles currently occupied by actors (any game object with position)
   */
  private getOccupiedTilesByActors(): Set<string> {
    const occupiedTiles = new Set<string>();

    this.scene.children.each((child) => {
      const representableComponent = getActorComponent(child, RepresentableComponent);
      if (!representableComponent) return;
      const tiles = getTileCoordsUnderObject(this.tilemap, child);
      tiles.forEach(({ x, y }) => {
        occupiedTiles.add(`${x},${y}`);
      });
    });

    return occupiedTiles;
  }

  /**
   * Finds the closest unoccupied and walkable tile to the given tile position that is also reachable via pathfinding.
   * Unoccupied means no actor sits on the tile (regardless of collider).
   * Similar to randomTileInNavigableRadius but returns the closest reachable unoccupied tile instead of random.
   */
  public async getClosestUnoccupiedTile(
    targetTile: Vector2Simple,
    maxRadius: number = 10
  ): Promise<Vector2Simple | undefined> {
    const occupiedTiles = this.getOccupiedTilesByActors();

    // First check if the target tile itself is unoccupied and walkable
    if (
      this.isWithinGridBounds(targetTile) &&
      this.isTileWalkable(targetTile) &&
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

          // Check if tile is within bounds, walkable, and unoccupied
          if (
            this.isWithinGridBounds(candidate) &&
            this.isTileWalkable(candidate) &&
            !occupiedTiles.has(`${candidate.x},${candidate.y}`)
          ) {
            candidateTiles.push(candidate);
          }
        }
      }

      if (candidateTiles.length > 0) {
        // Sort by Euclidean distance
        candidateTiles.sort((a, b) => this.getTileDistance(a, targetTile) - this.getTileDistance(b, targetTile));

        // Test each candidate tile for pathfinding reachability
        for (const candidate of candidateTiles) {
          try {
            const path = await this.find(targetTile, candidate);

            // Calculate actual path length to ensure it's within radius
            const pathLength = path.reduce((sum, node, index) => {
              const previousNode = index === 0 ? targetTile : path[index - 1];
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
          } catch (e) {
            // Path not found to this candidate, continue to next
            continue;
          }
        }
      }
    }

    return undefined;
  }
}
