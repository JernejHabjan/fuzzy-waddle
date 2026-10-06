import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
import Phaser, { GameObjects } from "phaser";
import { getActorComponent } from "../../data/actor-component";
import { getCenterTileCoordUnderObject, getTileCoordsUnderObject } from "../../library/tile-under-object";
import { drawDebugPath } from "../../debug/debug-path";
import { drawDebugPoint } from "../../debug/debug-point";
import { getSceneComponent, getSceneService } from "./scene-component-helpers";
import { TilemapComponent } from "../tilemap/tilemap.component";
import { getSelectableGameObject, onSceneInitialized } from "../../data/game-object-helper";
import { RandomService } from "./random.service";
import { throttleWithTrailing } from "../../library/throttle";
import { environment } from "@fuzzy-waddle/environments/environment";
import { ActorIndexSystem } from "./ActorIndexSystem";
import { DistanceHelper } from "../../library/distance-helper";
import { MovementTerrainType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/movement/movement-terrain-type";
import { ActorTranslateComponent } from "../../entity/components/movement/actor-translate-component";
import { TerrainGridBuilder } from "./terrain-grid-builder";
import { WaterNavigationHelper } from "./water-navigation.helper";
import type { HeightNavigationGraph } from "./height-navigation-graph-builder";
import type { MovementDynamicBlocker } from "./movement-occupancy.service";
import { getDynamicBlockedTileKeysForHeightGraph } from "./height-navigation-dynamic-blockers";
import { NavigationHeightGraph } from "./navigation-height-graph";
import { GroundNavigationPathfinder } from "./ground-navigation-pathfinder";
import { NavigationObjectGrid } from "./navigation-object-grid";
import { NavigationTileSelection } from "./navigation-tile-selection";
import { NavigationObjectRoutes } from "./navigation-object-routes";
import { TerrainType } from "./navigation-terrain-type";

// Keep the existing public import path and the same enum identity for movement callers.
export { TerrainType } from "./navigation-terrain-type";

/** Scene-owned navigation facade; native graph, cache and selection owners share its existing API. */
export class NavigationService {
  private readonly terrainTypes = Object.values(TerrainType);
  static UpdateNavigationEvent = "updateNavigation";
  private actorIndex!: ActorIndexSystem;
  private randomService!: RandomService;
  private easyStarNavigationGrid: number[][] = [];
  private tilemapGrid: number[][] = [];
  private readonly DEBUG = false;
  private readonly DEBUG_DEMO = false;
  private readonly DEBUG_CLICK_INFO = false;
  private readonly DEBUG_OBJECT_TARGET_PATHS = false;
  private readonly heightGraph: NavigationHeightGraph;
  private readonly groundPaths: GroundNavigationPathfinder;
  private readonly objectGrid: NavigationObjectGrid;
  private readonly selection: NavigationTileSelection;
  private readonly objectRoutes: NavigationObjectRoutes;
  private readonly waterNavHelper = new WaterNavigationHelper();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly tilemap: Phaser.Tilemaps.Tilemap
  ) {
    this.scene.events.on(NavigationService.UpdateNavigationEvent, this.throttleUpdateNavigation, this);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.heightGraph = new NavigationHeightGraph(scene, tilemap, this.DEBUG_CLICK_INFO);
    this.groundPaths = new GroundNavigationPathfinder(this.heightGraph, this.DEBUG, (path) => this.drawDebugPath(path));
    this.objectGrid = new NavigationObjectGrid(scene, tilemap, this.DEBUG);
    this.selection = new NavigationTileSelection(
      tilemap, this, () => this.easyStarNavigationGrid, this.waterNavHelper,
      () => this.randomService, () => this.actorIndex,
      (from, to, terrain) => this.findPathForTerrain(from, to, terrain)
    );
    this.objectRoutes = new NavigationObjectRoutes(
      scene, tilemap, this, this.selection, this.heightGraph, (actor) => this.getUnitTerrainType(actor),
      (from, to, terrain) => this.findPathForTerrain(from, to, terrain), this.DEBUG_OBJECT_TARGET_PATHS
    );
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
            const heightInfo = this.heightGraph.getNavigationCell({ x, y });
            const directions = this.heightGraph.directionalConditions.get(`${x}_${y}`);
            console.log(`Tile (${x},${y}):`, {
              heightInfo,
              conditionalDirections: directions
            });
          });
        }
      );
    }

    if (this.DEBUG_DEMO) {
      this.groundPaths.findPath({ x: 33, y: 33 }, { x: 5, y: 10 });
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
    const objectsGrid = this.objectGrid.build(this.tilemapGrid);
    this.easyStarNavigationGrid = this.tilemapGrid.map((row, i) =>
      row.map((tile, j) => {
        const objectValue = objectsGrid[i]?.[j];
        if (objectValue === undefined) return tile; // no object, use tilemap easyStarNavigationGrid
        if (objectValue === 0) return 0; // navigable object
        if (objectValue === 1) return 1; // blocked by object
        return tile; // tilemap easyStarNavigationGrid
      })
    );
    this.heightGraph.build(this.easyStarNavigationGrid);
    this.groundPaths.setup(this.easyStarNavigationGrid);
  }

  /**
   * Public read-only wrapper for the static height-graph traversal rule.
   * Callers that need to make one-off movement decisions should reuse the
   * graph-owned edge test instead of reimplementing direction checks.
   */
  canTraverseBetweenTiles(from: Vector2Simple, to: Vector2Simple): boolean {
    return this.heightGraph.canTraverseBetween(from, to);
  }

  getConnectedNavigableTiles(
    startTile: Vector2Simple,
    options: { sameHeightOnly?: boolean; maxTiles?: number } = {}
  ): Vector2Simple[] {
    return this.heightGraph.getConnectedNavigableTiles(startTile, options);
  }

  getHeightGraphDebugSnapshot(): HeightNavigationGraph | undefined {
    return this.heightGraph.getHeightGraphDebugSnapshot();
  }

  /**
   * Finds a path for one actor while overlaying transient occupancy blockers on
   * top of the static terrain grid. Height-graph directions are still enforced,
   * so congestion handling cannot invent invalid wall or stairs transitions.
   * @param gameObject Actor requesting the path.
   * @param toTile Requested destination tile.
   * @param dynamicBlockers Temporary occupancy blockers to overlay for this query.
   */
  async findPathFromGameObjectToTileAvoidingDynamicBlockers(
    gameObject: Phaser.GameObjects.GameObject,
    toTile: Vector2Simple,
    dynamicBlockers: MovementDynamicBlocker[]
  ): Promise<Vector2Simple[] | null> {
    const fromTile = getCenterTileCoordUnderObject(this.tilemap, gameObject);
    if (!fromTile) return [];
    const terrainType = this.getUnitTerrainType(gameObject);
    if (terrainType === MovementTerrainType.Water) return this.findPathForTerrain(fromTile, toTile, terrainType);

    // Dynamic blockers are overlaid only for this request. The cached/static
    // navigation grid remains unchanged, so one actor's congestion recovery
    // cannot poison normal pathfinding for everyone else.
    const blockedKeys = this.getDynamicBlockedTileKeys(dynamicBlockers, fromTile, toTile);
    const grid = this.easyStarNavigationGrid.map((row, y) =>
      row.map((tile, x) => (blockedKeys.has(`${x},${y}`) ? 1 : tile))
    );
    return this.groundPaths.findPathWithGrid(fromTile, toTile, grid, true);
  }

  /**
   * Converts dynamic occupancy entries into tile keys that can be painted onto
   * a temporary pathfinding grid for a single query.
   * @param dynamicBlockers Temporary occupancy blockers with their height layers.
   * @param fromTile The querying actor's current tile, which stays passable.
   * @param toTile The requested destination tile, which also stays passable.
   */
  private getDynamicBlockedTileKeys(
    dynamicBlockers: MovementDynamicBlocker[],
    fromTile: Vector2Simple,
    toTile: Vector2Simple
  ): Set<string> {
    return getDynamicBlockedTileKeysForHeightGraph(
      dynamicBlockers,
      (tile) => this.heightGraph.getNavigationCell(tile)?.navigableHeight,
      fromTile,
      toTile
    );
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

  private throttleUpdateNavigation = throttleWithTrailing(this.updateNavigation.bind(this), 100);

  private updateNavigation() {
    this.setup();
    // Clear both the distance cache and path cache when navigation grid changes
    DistanceHelper.clearNavigationCache();
    this.groundPaths.clearCache();
    this.waterNavHelper.clearCache();
  }

  /**
   * Samples native candidates until a nonempty path within the requested radius is found.
   */
  randomTileInNavigableRadius(
    currentTile: Vector2Simple,
    radiusFromCurrentTile: number,
    terrainType: MovementTerrainType = MovementTerrainType.Ground
  ): Promise<Vector2Simple | null> {
    return this.selection.randomTileInNavigableRadius(currentTile, radiusFromCurrentTile, terrainType);
  }

  public randomTileInRadius(currentTile: Vector2Simple, radiusTiles: number): Vector2Simple | undefined {
    return this.selection.randomTileInRadius(currentTile, radiusTiles);
  }

  /**
   * respects blocked tiles under object plus radius around them
   */
  public closestNavigableTileBetweenGameObjectsInRadius(
    gameObject: Phaser.GameObjects.GameObject,
    destinationGameObject: Phaser.GameObjects.GameObject,
    radiusTiles?: number
  ): Vector2Simple | undefined {
    return this.objectRoutes.closestNavigableTileBetweenGameObjectsInRadius(gameObject, destinationGameObject, radiusTiles);
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
    return this.groundPaths.findPath(from, to);
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
    return this.groundPaths.findPath(fromTile, toTile);
  }

  getCenterTileCoordUnderObject(gameObject: Phaser.GameObjects.GameObject): Vector2Simple | undefined {
    return getCenterTileCoordUnderObject(this.tilemap, gameObject);
  }

  /**
   * Finds a path from the gameObject to the targetGameObject within the specified radius.
   * Respects blocked tiles under the targetGameObject.
   */
  public findAndUseNavigablePathBetweenGameObjectsWithRadius(
    gameObject: Phaser.GameObjects.GameObject,
    targetGameObject: Phaser.GameObjects.GameObject,
    radiusTiles?: number
  ): Promise<Vector2Simple[] | null> {
    return this.objectRoutes.findAndUseNavigablePathBetweenGameObjectsWithRadius(gameObject, targetGameObject, radiusTiles);
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

  private destroy() {
    this.scene?.events.off(NavigationService.UpdateNavigationEvent, this.throttleUpdateNavigation, this);
    this.groundPaths.clearCache();
  }

  getTerrainUnderActor(gameObject: Phaser.GameObjects.GameObject): TerrainType | undefined {
    const tilesUnderActor = getTileCoordsUnderObject(this.tilemap, gameObject);
    for (const tile of tilesUnderActor) {
      const tileData = this.tilemap.getTileAt(tile.x, tile.y);
      const terrainType = tileData?.properties.terrainType;
      if (terrainType && this.terrainTypes.includes(terrainType)) {
        return terrainType as TerrainType;
      }
    }

    // Walkable prefabs can replace non-navigable map tiles (for example a bridge
    // over water). They are a solid surface for movement audio when no terrain
    // tile supplies a terrain type.
    if (tilesUnderActor.some((tile) => this.heightGraph.getNavigationCell(tile)?.navigableComponent)) {
      return TerrainType.Stone;
    }

    return undefined;
  }

  getNavigableHeightAtTile(tile: Vector2Simple): number {
    return this.heightGraph.getNavigableHeightAtTile(tile);
  }

  /**
   * Finds the closest unoccupied and navigable tile to the given tile position that is also reachable via pathfinding.
   * Unoccupied means no actor sits on the tile (regardless of collider).
   * Similar to randomTileInNavigableRadius but returns the closest reachable unoccupied tile instead of random.
   */
  public getClosestUnoccupiedTile(
    targetTile: Vector2Simple,
    maxRadius: number = 10,
    terrainType: MovementTerrainType = MovementTerrainType.Ground
  ): Promise<Vector2Simple | undefined> {
    return this.selection.getClosestUnoccupiedTile(targetTile, maxRadius, terrainType);
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
   * Returns undefined when no free candidate exists within maxRange.
   */
  public getSpawnPointAroundGameObject(
    gameObject: GameObjects.GameObject,
    maxRange: number = 10,
    targetTile?: Vector2Simple
  ): Vector2Simple | undefined {
    return this.selection.getSpawnPointAroundGameObject(gameObject, maxRange, targetTile);
  }
}
