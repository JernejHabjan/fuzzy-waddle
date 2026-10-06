import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
import type Phaser from "phaser";
import { MovementTerrainType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/movement/movement-terrain-type";
import { getActorComponent } from "../../data/actor-component";
import { NavigableComponent } from "../../entity/components/movement/navigable-component";
import { getCenterTileCoordUnderObject, getTileCoordsUnderObject } from "../../library/tile-under-object";
import { isGameObjectActiveInActiveScene } from "../../data/game-object-helper";
import { HEIGHT_NAVIGATION_DIRECTIONS } from "./height-navigation-graph-builder";
import { NavigationHeightGraph } from "./navigation-height-graph";
import type { NavigationTileSelection } from "./navigation-tile-selection";
import type { NavigationService } from "./navigation.service";

/** Preserves target-footprint selection, native terrain routing and optional object-path debug output. */
export class NavigationObjectRoutes {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly tilemap: Phaser.Tilemaps.Tilemap,
    private readonly navigation: Pick<NavigationService, "closestNavigableTileBetweenGameObjectsInRadius">,
    private readonly selection: NavigationTileSelection,
    private readonly heightGraph: NavigationHeightGraph,
    private readonly getUnitTerrainType: (actor: Phaser.GameObjects.GameObject) => MovementTerrainType,
    private readonly findPathForTerrain: (
      from: Vector2Simple, to: Vector2Simple, terrain: MovementTerrainType
    ) => Promise<Vector2Simple[] | null>,
    private readonly DEBUG_OBJECT_TARGET_PATHS: boolean
  ) {}

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
    const shouldMoveOntoNavigableTarget = isNavigable && (radiusTiles === undefined || radiusTiles <= 0);
    const targetTiles = getTileCoordsUnderObject(this.tilemap, destinationGameObject);

    let closestNavigableTile;
    if (shouldMoveOntoNavigableTarget) {
      // Direct move orders for navigable structures still route onto the
      // structure itself. Range-limited queries must not bypass the radius and
      // therefore use the blocked-footprint search below instead.
      const destinationTile = getCenterTileCoordUnderObject(this.tilemap, destinationGameObject);
      if (!destinationTile) return undefined;
      closestNavigableTile = destinationTile;
      if (this.DEBUG_OBJECT_TARGET_PATHS) {
        console.log(
          `[NavigableTargetSelection] actor=${gameObject.name} target=${destinationGameObject.name} ` +
            `from=${fromTile.x},${fromTile.y} destination=${destinationTile.x},${destinationTile.y} ` +
            `targetTiles=[${targetTiles.map((tile) => `${tile.x},${tile.y}`).join(";")}] ` +
            `radius=${radiusTiles ?? "-"} navigable=${isNavigable}`
        );
      }
    } else {
      // Range-limited object queries answer "which reachable tile gets me within
      // radius of this footprint?" even when the target structure itself is
      // navigable.
      // noinspection UnnecessaryLocalVariableJS
      closestNavigableTile = this.selection.getClosestNavigableTileAroundBlockedTilesInRadius(
        fromTile,
        targetTiles,
        radiusTiles,
        terrainType
      );
    }

    const targetCenterTile = getCenterTileCoordUnderObject(this.tilemap, destinationGameObject);
    if (this.DEBUG_OBJECT_TARGET_PATHS) {
      console.log(
        `[ObjectTargetTileChoice] actor=${gameObject.name} target=${destinationGameObject.name} ` +
          `from=${fromTile.x},${fromTile.y} chosen=${closestNavigableTile?.x ?? "?"},${closestNavigableTile?.y ?? "?"} ` +
          `center=${targetCenterTile?.x ?? "?"},${targetCenterTile?.y ?? "?"} ` +
          `targetTiles=[${targetTiles.map((tile) => `${tile.x},${tile.y}`).join(";")}] ` +
          `radius=${radiusTiles ?? "-"} navigable=${isNavigable}`
      );
    }

    return closestNavigableTile; // Return the closest navigable tile if found, or undefined
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
    if (!isGameObjectActiveInActiveScene(gameObject) || !isGameObjectActiveInActiveScene(targetGameObject)) {
      return null;
    }

    const fromTile = getCenterTileCoordUnderObject(this.tilemap, gameObject);
    if (!fromTile) return null;

    // Step 2: Find the closest navigable tile around the building within the radius.
    // The target object's own footprint stays blocked; callers move beside it,
    // not into the occupied structure tiles.
    const closestNavigableTile = this.navigation.closestNavigableTileBetweenGameObjectsInRadius(
      gameObject,
      targetGameObject,
      radiusTiles
    );

    if (!closestNavigableTile) {
      return null; // No native target tile is available
    }

    // Step 3: Use EasyStar to find the path to the closest navigable tile
    const terrainType = this.getUnitTerrainType(gameObject);
    const path = await this.findPathForTerrain(fromTile, closestNavigableTile, terrainType);
    if (this.DEBUG_OBJECT_TARGET_PATHS) {
      const centerTile = getCenterTileCoordUnderObject(this.tilemap, targetGameObject);
      const pathString = path ? path.map((tile) => `${tile.x},${tile.y}`).join(" -> ") : "null";
      console.log(
        `[ObjectTargetPath] actor=${gameObject.name} target=${targetGameObject.name} ` +
          `from=${fromTile.x},${fromTile.y} chosen=${closestNavigableTile.x},${closestNavigableTile.y} ` +
          `center=${centerTile?.x ?? "?"},${centerTile?.y ?? "?"} ` +
          `targetTiles=[${getTileCoordsUnderObject(this.tilemap, targetGameObject)
            .map((tile) => `${tile.x},${tile.y}`)
            .join(";")}] path=${pathString}`
      );
    }
    if (!path) {
      this.logMissingObjectTargetPath(gameObject, targetGameObject, fromTile, closestNavigableTile);
    }
    return path;
  }

  private logMissingObjectTargetPath(
    gameObject: Phaser.GameObjects.GameObject,
    targetGameObject: Phaser.GameObjects.GameObject,
    fromTile: Vector2Simple,
    targetTile: Vector2Simple
  ): void {
    if (!this.DEBUG_OBJECT_TARGET_PATHS) return;
    const targetObjectTiles = getTileCoordsUnderObject(this.tilemap, targetGameObject);
    const nearbyNavigables = this.scene.children.list
      .filter((child) => !!getActorComponent(child, NavigableComponent))
      .map((child) => ({
        name: child.name,
        center: getCenterTileCoordUnderObject(this.tilemap, child),
        tiles: getTileCoordsUnderObject(this.tilemap, child)
      }))
      .filter(
        (entry) =>
          entry.center &&
          (entry.tiles.some((tile) => tile.x === fromTile.x && tile.y === fromTile.y) ||
            (Math.abs(entry.center.x - fromTile.x) <= 2 && Math.abs(entry.center.y - fromTile.y) <= 2) ||
            (Math.abs(entry.center.x - targetTile.x) <= 2 && Math.abs(entry.center.y - targetTile.y) <= 2))
      )
      .sort((a, b) => {
        const aCenter = a.center!;
        const bCenter = b.center!;
        if (aCenter.y !== bCenter.y) return aCenter.y - bCenter.y;
        return aCenter.x - bCenter.x;
      });

    const nearbySummary = nearbyNavigables
      .map((entry) => {
        const center = entry.center!;
        const cell = this.heightGraph.getNavigationCell(center);
        const dirs = this.heightGraph.getAllowedDirectionsAtTile(center).join("|") || "-";
        const tiles = entry.tiles.map((tile) => `${tile.x},${tile.y}`).join(";");
        return `${entry.name}@${center.x},${center.y} tiles=[${tiles}] h=${cell?.navigableHeight ?? "?"} dirs=[${dirs}]`;
      })
      .join(" || ");

    const fromCell = this.heightGraph.getNavigationCell(fromTile);
    const targetCell = this.heightGraph.getNavigationCell(targetTile);
    const fromDirs = this.heightGraph.getAllowedDirectionsAtTile(fromTile).join("|") || "-";
    const targetDirs = this.heightGraph.getAllowedDirectionsAtTile(targetTile).join("|") || "-";

    const adjacentChecks = HEIGHT_NAVIGATION_DIRECTIONS.map(({ direction, dx, dy }) => {
      const candidate = { x: fromTile.x + dx, y: fromTile.y + dy };
      return `${direction}:${candidate.x},${candidate.y}=${this.heightGraph.canTraverseBetween(fromTile, candidate)}`;
    }).join(" ");

    console.log(
      `[MissingObjectTargetPath] actor=${gameObject.name} from=${fromTile.x},${fromTile.y} ` +
        `target=${targetGameObject.name} targetTile=${targetTile.x},${targetTile.y} ` +
        `targetTiles=[${targetObjectTiles.map((tile) => `${tile.x},${tile.y}`).join(";")}] ` +
        `fromCell=h${fromCell?.navigableHeight ?? "?"}/dirs[${fromDirs}] ` +
        `targetCell=h${targetCell?.navigableHeight ?? "?"}/dirs[${targetDirs}] ` +
        `fromAdjacent={${adjacentChecks}} nearby={${nearbySummary || "-"}}`
    );
  }
}
