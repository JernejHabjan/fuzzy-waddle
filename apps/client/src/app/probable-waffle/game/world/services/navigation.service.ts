import {
  BOTTOM,
  BOTTOM_LEFT,
  BOTTOM_RIGHT,
  type Direction,
  js as EasyStar,
  LEFT,
  RIGHT,
  TOP,
  TOP_LEFT,
  TOP_RIGHT
} from "easystarjs";
import type { Vector2Simple } from "@fuzzy-waddle/api-interfaces";
import Phaser, { GameObjects } from "phaser";
import { getActorComponent } from "../../data/actor-component";
import { NavigableComponent } from "../../entity/components/movement/navigable-component";
import { ColliderComponent } from "../../entity/components/movement/collider-component";
import { getCenterTileCoordUnderObject, getTileCoordsUnderObject } from "../../library/tile-under-object";
import { drawDebugPath } from "../../debug/debug-path";
import { drawDebugPoint } from "../../debug/debug-point";
import { getSceneComponent, getSceneService } from "./scene-component-helpers";
import { TilemapComponent } from "../tilemap/tilemap.component";
import { getSelectableGameObject, onSceneInitialized } from "../../data/game-object-helper";
import { RandomService } from "./random.service";
import { throttleWithTrailing } from "../../library/throttle";
import { environment } from "../../../../../environments/environment";
import { RepresentableComponent } from "../../entity/components/representable-component";
import type { NavigablePath } from "../../entity/components/movement/navigable-path";
import { NavigablePathDirection } from "../../entity/components/movement/navigable-path-direction";
import { ActorIndexSystem } from "./ActorIndexSystem";
import { DistanceHelper } from "../../library/distance-helper";
import { MovementTerrainType } from "../../entity/components/movement/movement-terrain-type";
import { ActorTranslateComponent } from "../../entity/components/movement/actor-translate-component";
import { TerrainGridBuilder } from "./terrain-grid-builder";
import { WaterNavigationHelper } from "./water-navigation.helper";

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
  navigableHeight: number;
  exitHeight: number;
  acceptMinimumHeight: number;
  isNavigable: boolean;
  navigableComponent?: NavigableComponent;
}

// Path cache for expensive pathfinding operations
interface PathCache {
  path: Vector2Simple[] | null;
  timestamp: number;
}

const PATH_CACHE_TTL_MS = 1000; // Cache paths for 1 second

export class NavigationService {
  private readonly terrainTypes = Object.values(TerrainType);
  static UpdateNavigationEvent = "updateNavigation";
  private readonly easyStar: EasyStar;
  private actorIndex!: ActorIndexSystem;
  private randomService!: RandomService;
  private easyStarNavigationGrid: number[][] = [];
  private tilemapGrid: number[][] = [];
  private heightMapGrid: HeightMapCell[][] = [];
  private readonly DEBUG = false;
  private readonly DEBUG_DEMO = false;
  private readonly DEBUG_CLICK_INFO = false;
  private directionalConditions: Map<string, Direction[]> = new Map();
  private pathCache = new Map<string, PathCache>();
  private readonly waterNavHelper = new WaterNavigationHelper();

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
    this.actorIndex = getSceneService(this.scene, ActorIndexSystem)!;
    this.randomService = getSceneService(this.scene, RandomService)!;

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
          if (!object) return;
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
      this.findPath({ x: 33, y: 33 }, { x: 5, y: 10 });
      this.debugNavigableRadius();
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
      const tileWorldXY = this.getTileWorldCenter(randomTile)!;
      drawDebugPoint(this.scene, tileWorldXY, 0x0000ff);
    };

    for (let i = 0; i < 200; i++) {
      // noinspection ES6MissingAwait
      findAndDebugDrawRandomTileInNavigableRadius();
    }
  }

  public static getTileWorldCenter(tilemap: Phaser.Tilemaps.Tilemap, tileXY: Vector2Simple): Vector2Simple | undefined {
    const tileAtStart = tilemap.getTileAt(tileXY.x, tileXY.y);
    if (!tileAtStart) return;
    const centerX = tileAtStart.getCenterX();
    const centerY = tileAtStart.getCenterY();
    return { x: centerX, y: centerY };
  }

  getTileWorldCenter(tileXY: Vector2Simple): Vector2Simple | undefined {
    return NavigationService.getTileWorldCenter(this.tilemap, tileXY);
  }

  private setup() {
    const objectsGrid = this.extractGridFromObjects();
    this.easyStarNavigationGrid = this.tilemapGrid.map((row, i) =>
      row.map((tile, j) => {
        const objectValue = objectsGrid[i]?.[j];
        if (objectValue === undefined) return tile; // no object, use tilemap easyStarNavigationGrid
        if (objectValue === 0) return 0; // navigable object
        if (objectValue === 1) return 1; // blocked by object
        return tile; // tilemap easyStarNavigationGrid
      })
    );
    this.extractHeightMapGrid();
    this.setupNavigation();
  }

  // Populate heightMapGrid with info from tilemap and Navigable objects
  private extractHeightMapGrid() {
    // Initialize grid with default values
    this.heightMapGrid = this.tilemapGrid.map((row) =>
      row.map((tile) => ({
        navigableHeight: 0,
        exitHeight: 0,
        acceptMinimumHeight: 0,
        isNavigable: tile === 0
      }))
    );

    const navigableTilesToProcess: { x: number; y: number; navigableComponent: NavigableComponent }[] = [];

    // First pass: Overlay Navigable objects without checking accessibility yet
    this.scene.children.each((child) => {
      const navigableComponent = getActorComponent(child, NavigableComponent);
      if (!navigableComponent) return;
      const tiles = getTileCoordsUnderObject(this.tilemap, child);
      const def = navigableComponent.navigableDefinition;
      tiles.forEach(({ x, y }) => {
        if (!(this.heightMapGrid[y] && this.heightMapGrid[y][x])) return; // Skip if out of bounds
        this.heightMapGrid[y][x] = {
          navigableHeight: def.navigableHeight ?? 0,
          exitHeight: def.exitHeight ?? 0,
          acceptMinimumHeight: def.acceptMinimumHeight ?? 0,
          isNavigable: false, // Assume not navigable until proven otherwise in the second pass
          navigableComponent: navigableComponent
        };
        navigableTilesToProcess.push({ x, y, navigableComponent });
      });
    });

    // Second pass: Determine accessibility for all navigable objects
    navigableTilesToProcess.forEach(({ x, y }) => {
      const cell = this.heightMapGrid[y]?.[x];
      if (!cell) return;
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
        if (ny >= 0 && ny < this.heightMapGrid.length && nx >= 0 && nx < this.heightMapGrid[ny]!.length) {
          const neighbor = this.heightMapGrid[ny]![nx]!;
          // Accessible if neighbor is navigable and can access from neighbor to this tile
          if (this.canAccessFrom(neighbor, cell)) {
            cell.isNavigable = true;
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
      for (let x = 0; x < this.heightMapGrid[y]!.length; x++) {
        const cell = this.heightMapGrid[y]![x]!;
        if (!cell.isNavigable) continue;
        const allowedDirections: Direction[] = [];

        // Check all 8 directions
        const directions: { dir: Direction; dx: number; dy: number; name: NavigablePathDirection }[] = [
          { dir: TOP, dx: 0, dy: -1, name: NavigablePathDirection.Top },
          { dir: BOTTOM, dx: 0, dy: 1, name: NavigablePathDirection.Bottom },
          { dir: LEFT, dx: -1, dy: 0, name: NavigablePathDirection.Left },
          { dir: RIGHT, dx: 1, dy: 0, name: NavigablePathDirection.Right },
          { dir: TOP_LEFT, dx: -1, dy: -1, name: NavigablePathDirection.TopLeft },
          { dir: TOP_RIGHT, dx: 1, dy: -1, name: NavigablePathDirection.TopRight },
          { dir: BOTTOM_LEFT, dx: -1, dy: 1, name: NavigablePathDirection.BottomLeft },
          { dir: BOTTOM_RIGHT, dx: 1, dy: 1, name: NavigablePathDirection.BottomRight }
        ];

        const checkDirection = (
          dir: Direction,
          dx: number,
          dy: number,
          name: NavigablePathDirection,
          pathDef?: NavigablePath
        ) => {
          const nx = x + dx;
          const ny = y + dy;
          if (ny >= 0 && ny < this.heightMapGrid.length && nx >= 0 && nx < this.heightMapGrid[ny]!.length) {
            const neighbor = this.heightMapGrid[ny]![nx]!;
            const neighborNavigableComponent = neighbor.navigableComponent;

            // check if we can move from cell to neighbor based on height
            const canMoveToNeighbor = this.canAccessFrom(cell, neighbor);
            // check if we can move from neighbor to cell based on height
            const canMoveFromNeighbor = this.canAccessFrom(neighbor, cell);

            if (!canMoveToNeighbor && !canMoveFromNeighbor) return;

            // Check if current cell restricts movement in this direction (exiting check)
            // If pathDef is undefined, the cell is accessible from all sides
            if (pathDef && !pathDef[name]) {
              // Current cell doesn't allow exiting in this direction
              return;
            }

            // Check if neighbor cell restricts movement from the opposite direction (entering check)
            if (neighborNavigableComponent && !neighborNavigableComponent.accessibleFromAllSides) {
              const neighborPathDef = neighborNavigableComponent.navigablePathDefinition;
              if (!neighborPathDef) {
                // This indicates a data integrity issue: accessibleFromAllSides is false but no path definition exists
                console.warn(
                  `NavigableComponent at (${nx}, ${ny}) has accessibleFromAllSides=false but undefined navigablePathDefinition. ` +
                    `Checking from (${x}, ${y}) direction ${name}`
                );
                return;
              }
              const oppositeDirection: NavigablePathDirection | undefined = {
                [NavigablePathDirection.Top]: NavigablePathDirection.Bottom,
                [NavigablePathDirection.Bottom]: NavigablePathDirection.Top,
                [NavigablePathDirection.Left]: NavigablePathDirection.Right,
                [NavigablePathDirection.Right]: NavigablePathDirection.Left,
                [NavigablePathDirection.TopLeft]: NavigablePathDirection.BottomRight,
                [NavigablePathDirection.TopRight]: NavigablePathDirection.BottomLeft,
                [NavigablePathDirection.BottomLeft]: NavigablePathDirection.TopRight,
                [NavigablePathDirection.BottomRight]: NavigablePathDirection.TopLeft
              }[name];
              if (!oppositeDirection || !neighborPathDef[oppositeDirection]) {
                // Neighbor doesn't allow entry from this direction
                return;
              }
            }

            allowedDirections.push(dir);
          }
        };

        const navigableComponent = cell.navigableComponent;
        const pathDef = navigableComponent?.navigablePathDefinition;
        const accessibleFromAllSides = navigableComponent?.accessibleFromAllSides ?? true;

        if (navigableComponent && !accessibleFromAllSides) {
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
  // Or if stairs (navigableHeight < exitHeight) allow access from ground to stairs/wall
  private canAccessFrom(from: HeightMapCell, to: HeightMapCell): boolean {
    // Allow access if exitHeight of 'from' >= acceptMinimumHeight of 'to'
    if (from.exitHeight >= to.acceptMinimumHeight) return true;
    // Stairs logic: allow access from ground to stairs/wall
    // noinspection RedundantIfStatementJS
    if (from.navigableHeight < from.exitHeight && to.navigableHeight >= from.exitHeight) return true;
    return false;
  }

  private async findPath(fromTileXY: Vector2Simple, toTileXY: Vector2Simple): Promise<Vector2Simple[] | null> {
    // Create cache key
    const cacheKey = `${fromTileXY.x},${fromTileXY.y}->${toTileXY.x},${toTileXY.y}`;
    const now = performance.now();

    // Check cache
    const cached = this.pathCache.get(cacheKey);
    if (cached && now - cached.timestamp < PATH_CACHE_TTL_MS) {
      return cached.path;
    }

    return new Promise((resolve) => {
      this.easyStar.findPath(fromTileXY.x, fromTileXY.y, toTileXY.x, toTileXY.y, (path) => {
        const result = !path ? null : path.length === 0 ? [] : path;

        if (this.DEBUG && result) {
          this.drawDebugPath(result);
        }

        // Cache the result
        this.pathCache.set(cacheKey, { path: result, timestamp: now });

        // Periodically clean up old cache entries
        if (this.pathCache.size > 1000) {
          this.cleanPathCache(now);
        }

        resolve(result);
      });
      this.easyStar.calculate();
    });
  }

  private cleanPathCache(now: number = performance.now()): void {
    for (const [key, value] of this.pathCache.entries()) {
      if (now - value.timestamp >= PATH_CACHE_TTL_MS) {
        this.pathCache.delete(key);
      }
    }
  }

  private extractTilemapGrid() {
    const tileMapComponent = getSceneComponent(this.scene, TilemapComponent);
    if (!tileMapComponent) throw new Error("TilemapComponent not found");
    const data = tileMapComponent.data;
    // Ground grid: block navigationRestriction tiles AND water terrain tiles
    this.tilemapGrid = TerrainGridBuilder.buildGroundGrid(data);
    // Water grid: only water terrain tiles are navigable
    this.waterNavHelper.setup(data);
  }

  /**
   * Undefined by default
   * 0 for navigable
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
      emptyGrid[tile.y]![tile.x]! = 1;
    });

    const navigables = this.getTileIndexesForNavigables();
    const actualNavigableTiles = navigables.map((tileIndex) => this.tilemap.getTileAt(tileIndex.x, tileIndex.y));
    // tint tiles to green
    actualNavigableTiles.forEach((tile) => {
      if (!tile) return;
      if (this.DEBUG) tile.tint = 0x00ff00;
      emptyGrid[tile.y]![tile.x]! = 0;
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

  private setupNavigation() {
    this.easyStar.setGrid(this.easyStarNavigationGrid);
    this.easyStar.setAcceptableTiles([0]);
    this.easyStar.enableDiagonals();
    this.setDirectionalConditions();
  }

  private throttleUpdateNavigation = throttleWithTrailing(this.updateNavigation.bind(this), 100);

  private updateNavigation() {
    this.setup();
    // Clear both the distance cache and path cache when navigation grid changes
    DistanceHelper.clearNavigationCache();
    this.pathCache.clear();
    this.waterNavHelper.clearCache();
  }

  /**
   * Uses navigation easyStarNavigationGrid to find a random tile that can be navigated to from the current tile within the radius of current tile
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
      const randomIndex = this.randomService.between(0, validTiles.length - 1);
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
    const randomIndex = this.randomService.between(0, validTiles.length - 1);
    return validTiles[randomIndex];
  }

  /**
   * respects blocked tiles under object plus radius around them
   */
  public closestNavigableTileBetweenGameObjectsInRadius(
    gameObject: Phaser.GameObjects.GameObject,
    destinationGameObject: Phaser.GameObjects.GameObject,
    radiusTiles?: number
  ): Vector2Simple | undefined {
    const fromTile = getCenterTileCoordUnderObject(this.tilemap, gameObject);
    if (!fromTile) return undefined;

    const terrainType = this.getUnitTerrainType(gameObject);
    const isNavigable = !!getActorComponent(destinationGameObject, NavigableComponent);

    let closestNavigableTile;
    if (isNavigable) {
      // no need to find the closest navigable - try to find the tile under the destination object
      // this moves actor ON the wall or tower
      const destinationTile = getCenterTileCoordUnderObject(this.tilemap, destinationGameObject);
      if (!destinationTile) return undefined;
      closestNavigableTile = destinationTile; // Use the tile under the destination object directly
    } else {
      // Step 1: Get blocked tiles (occupied by the destination object)
      const blockedTiles = getTileCoordsUnderObject(this.tilemap, destinationGameObject);

      // Step 2: Find the closest navigable tile around the blocked tiles within the radius
      // noinspection UnnecessaryLocalVariableJS
      closestNavigableTile = this.getClosestNavigableTileAroundBlockedTilesInRadius(
        fromTile,
        blockedTiles,
        radiusTiles,
        terrainType
      );
    }

    return closestNavigableTile; // Return the closest navigable tile if found, or undefined
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
        const firstVal = this.easyStarNavigationGrid[0];
        if (!firstVal) continue;
        // Ensure coordinates are within easyStarNavigationGrid bounds
        if (0 <= x && x < firstVal.length && 0 <= y && y < this.easyStarNavigationGrid.length) {
          if (navigable) {
            if (this.easyStarNavigationGrid[y]?.[x] === 0) {
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

  /** Reads the MovementTerrainType from a gameObject's ActorTranslateComponent definition. */
  private getUnitTerrainType(gameObject: Phaser.GameObjects.GameObject): MovementTerrainType {
    const translate = getActorComponent(gameObject, ActorTranslateComponent);
    return translate?.actorTranslateDefinition.movementTerrainType ?? MovementTerrainType.Ground;
  }

  /** Routes pathfinding to the correct grid based on the unit's terrain type. */
  private findPathForTerrain(
    from: Vector2Simple,
    to: Vector2Simple,
    terrainType: MovementTerrainType
  ): Promise<Vector2Simple[] | null> {
    if (terrainType === MovementTerrainType.Water) return this.waterNavHelper.findPath(from, to);
    return this.findPath(from, to);
  }

  /**
   * Returns a path from the current tile under the gameObject to the target tile
   */
  findPathFromGameObjectToTile(
    gameObject: Phaser.GameObjects.GameObject,
    toTile: Vector2Simple
  ): Promise<Vector2Simple[] | null> {
    const currentTile = getCenterTileCoordUnderObject(this.tilemap, gameObject);
    if (!currentTile) return Promise.resolve([]);
    const terrainType = this.getUnitTerrainType(gameObject);
    return this.findPathForTerrain(currentTile, toTile, terrainType);
  }

  async findPathBetweenGameObjects(
    gameObject: Phaser.GameObjects.GameObject,
    targetGameObject: Phaser.GameObjects.GameObject,
    radiusTiles: number | undefined = undefined
  ): Promise<Vector2Simple[] | null> {
    return this.findAndUseNavigablePathBetweenGameObjectsWithRadius(gameObject, targetGameObject, radiusTiles);
  }

  async findPathBetweenTiles(fromTile: Vector2Simple, toTile: Vector2Simple): Promise<Vector2Simple[] | null> {
    return this.findPath(fromTile, toTile);
  }

  getCenterTileCoordUnderObject(gameObject: Phaser.GameObjects.GameObject): Vector2Simple | undefined {
    return getCenterTileCoordUnderObject(this.tilemap, gameObject);
  }

  /**
   * Finds a path from the gameObject to the targetGameObject within the specified radius.
   * Respects blocked tiles under the targetGameObject.
   */
  public async findAndUseNavigablePathBetweenGameObjectsWithRadius(
    gameObject: Phaser.GameObjects.GameObject,
    targetGameObject: Phaser.GameObjects.GameObject,
    radiusTiles?: number
  ): Promise<Vector2Simple[] | null> {
    if (!gameObject.active || !targetGameObject.active) return null;

    const fromTile = getCenterTileCoordUnderObject(this.tilemap, gameObject);
    if (!fromTile) return null;

    // Step 2: Find the closest navigable tile around the building within the radius
    const closestNavigableTile = this.closestNavigableTileBetweenGameObjectsInRadius(
      gameObject,
      targetGameObject,
      radiusTiles
    );

    if (!closestNavigableTile) {
      return null; // Return an empty array if no navigable tile was found
    }

    // Step 3: Use EasyStar to find the path to the closest navigable tile
    const terrainType = this.getUnitTerrainType(gameObject);
    return this.findPathForTerrain(fromTile, closestNavigableTile, terrainType);
  }

  private getClosestNavigableTileAroundBlockedTilesInRadius(
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
            this.isWithinGridBounds(neighbor, terrainType) &&
            this.isTileNavigable(neighbor, terrainType) &&
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

  isWithinGridBounds(tile: Vector2Simple, terrainType: MovementTerrainType = MovementTerrainType.Ground): boolean {
    if (terrainType === MovementTerrainType.Water) return this.waterNavHelper.isWithinBounds(tile);
    const firstRow = this.easyStarNavigationGrid[0];
    if (!firstRow) return false;
    return tile.x >= 0 && tile.x < firstRow.length && tile.y >= 0 && tile.y < this.easyStarNavigationGrid.length;
  }

  public isTileNavigable(tile: Vector2Simple, terrainType: MovementTerrainType = MovementTerrainType.Ground): boolean {
    if (terrainType === MovementTerrainType.Water) return this.waterNavHelper.isTileNavigable(tile);
    return this.easyStarNavigationGrid[tile.y]?.[tile.x] === 0; // Check if the tile is navigable (0 means navigable)
  }

  public isTileGridWithoutBlockingObjectsNavigable(tile: Vector2Simple): boolean {
    return this.tilemapGrid[tile.y]?.[tile.x] === 0; // Check if the tile is navigable in the base tilemap grid
  }

  isAreaBeneathGameObjectNavigable(gameObject: Phaser.GameObjects.GameObject): boolean {
    const tileIndexesUnderObject = getTileCoordsUnderObject(this.tilemap, gameObject);
    const actualTilesUnderObject = tileIndexesUnderObject.map((tileIndex) =>
      this.tilemap.getTileAt(tileIndex.x, tileIndex.y)
    );
    return actualTilesUnderObject.every((tile) => tile && this.isTileNavigable({ x: tile.x, y: tile.y }));
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
    if (a.y !== b.y) {
      return a.y - b.y;
    }
    return a.x - b.x;
  }

  private destroy() {
    this.scene?.events.off(NavigationService.UpdateNavigationEvent, this.throttleUpdateNavigation, this);
    this.pathCache.clear();
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
   * Gets the navigable height at a specific tile position.
   * Returns the height (in px) at which units should stand when on this tile.
   * @param tile The tile coordinates to check
   * @returns The navigable height in pixels, or 0 if tile is out of bounds or not available
   */
  public getNavigableHeightAtTile(tile: Vector2Simple): number {
    // Validate Y coordinate and row existence
    const row = this.heightMapGrid[tile.y];
    if (!row || tile.y < 0) {
      console.warn(`getNavigableHeightAtTile: tile Y coordinate ${tile.y} is out of bounds`);
      return 0;
    }
    // Validate X coordinate
    if (tile.x < 0 || tile.x >= row.length) {
      console.warn(`getNavigableHeightAtTile: tile X coordinate ${tile.x} is out of bounds`);
      return 0;
    }
    const cell = row[tile.x];
    return cell?.navigableHeight ?? 0;
  }

  /**
   * Gets all tiles currently occupied by actors (any game object with position)
   */
  private getOccupiedTilesByActors(): Set<string> {
    const occupiedTiles = new Set<string>();

    const actorsWithRepresentable = this.actorIndex
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
      this.isWithinGridBounds(targetTile, terrainType) &&
      this.isTileNavigable(targetTile, terrainType) &&
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
            this.isWithinGridBounds(candidate, terrainType) &&
            this.isTileNavigable(candidate, terrainType) &&
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
   * Finds the nearest water tile to the given tile position (BFS outward).
   * Used when spawning water units from land buildings.
   */
  public findNearestWaterTile(fromTile: Vector2Simple, maxRadius = 30): Vector2Simple | null {
    return this.waterNavHelper.findNearestWaterTile(fromTile, maxRadius);
  }

  /** Returns true if the tile is a shore tile (water adjacent to land). */
  public isShoreTile(tile: Vector2Simple): boolean {
    return this.waterNavHelper.isShoreTile(tile);
  }

  /** BFS outward from `fromTile` to find the nearest shore tile. */
  public findNearestShoreTile(fromTile: Vector2Simple, maxRadius = 30): Vector2Simple | null {
    return this.waterNavHelper.findNearestShoreTile(fromTile, maxRadius);
  }

  /**
   * Given a shore tile (the water-side tile adjacent to land), finds the nearest
   * ground-navigable tile among its 8 neighbours so a land unit can stand at the water's edge.
   * Returns null if no navigable ground neighbour exists.
   */
  public findGroundTileAdjacentToShoreTile(shoreTile: Vector2Simple): Vector2Simple | null {
    const neighbors: Vector2Simple[] = [
      { x: shoreTile.x, y: shoreTile.y - 1 },
      { x: shoreTile.x, y: shoreTile.y + 1 },
      { x: shoreTile.x - 1, y: shoreTile.y },
      { x: shoreTile.x + 1, y: shoreTile.y },
      { x: shoreTile.x - 1, y: shoreTile.y - 1 },
      { x: shoreTile.x + 1, y: shoreTile.y - 1 },
      { x: shoreTile.x - 1, y: shoreTile.y + 1 },
      { x: shoreTile.x + 1, y: shoreTile.y + 1 }
    ];
    for (const n of neighbors) {
      if (this.easyStarNavigationGrid[n.y]?.[n.x] === 0) return n;
    }
    return null;
  }

  /**
   * Finds the unoccupied and navigable tile around the given game object.
   * Searches in expanding radii up to maxRange for a truly free tile.
   * Prefers tiles with higher y (bottom) and higher x (right), or towards targetTile if provided.
   * If no free tile found within maxRange, allows placement on occupied tiles.
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
        if (!this.isWithinGridBounds(c)) continue;
        if (!this.isTileNavigable(c)) continue;
        if (!allowOccupied && occupied.has(`${c.x},${c.y}`)) continue;
        return c;
      }
    }

    return undefined;
  }
}
