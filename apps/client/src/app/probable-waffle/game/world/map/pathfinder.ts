import {
  BOTTOM as EasyStar_BOTTOM,
  BOTTOM_LEFT as EasyStar_BOTTOM_LEFT,
  BOTTOM_RIGHT as EasyStar_BOTTOM_RIGHT,
  Direction as EasyStar_Direction,
  js as EasyStar,
  LEFT as EasyStar_LEFT,
  RIGHT as EasyStar_RIGHT,
  TOP as EasyStar_TOP,
  TOP_LEFT as EasyStar_TOP_LEFT,
  TOP_RIGHT as EasyStar_TOP_RIGHT
} from "easystarjs";
import { TilemapHelper } from "./tile/tilemap.helper";
import { TilePlacementWorldWithProperties } from "./tile/manual-tiles/manual-tiles.helper";
import { MapSizeInfo, TileDefinitions } from "../const/map-size.info";
import { SlopeDirection } from "./tile/types/tile-types";
import { Scene } from "phaser";
import { Vector2Simple } from "@fuzzy-waddle/api-interfaces";

export class Pathfinder {
  private readonly enableDiagonals = true;
  private readonly maxNavigableStepHeightDiff = 16;

  constructor(private readonly scene: Scene) {}

  public static DEPRECATED_getTileWorldCenterByPath(vector: Vector2Simple): Vector2Simple {
    return TilemapHelper.getTileWorldCenterByTilemapTileXY(vector, {
      centerOfTile: true
    });
  }

  public static getTileWorldCenter(tilemap: Phaser.Tilemaps.Tilemap, vector: Vector2Simple): Vector2Simple | undefined {
    const tileAtStart = tilemap.getTileAt(vector.x, vector.y);
    if (!tileAtStart) return;
    const centerX = tileAtStart.getCenterX();
    const centerY = tileAtStart.getCenterY();
    return { x: centerX, y: centerY };
  }

  find(
    from: Vector2Simple,
    to: Vector2Simple,
    navigationGridWithProperties: TilePlacementWorldWithProperties[][]
  ): Promise<TilePlacementWorldWithProperties[]> {
    return new Promise<TilePlacementWorldWithProperties[]>((resolve, reject) => {
      const easyStar = new EasyStar();

      // map only tileIndexes from navigationGrid
      const navigationGrid = navigationGridWithProperties.map((row) =>
        row.map((tile) => tile.tileLayerProperties.tileIndex)
      );

      easyStar.setGrid(navigationGrid);

      // const get distinct tile indexes from grid
      const tileIndexes: number[] = [...new Set(navigationGrid.flat())];

      // todo hardcoded to all existing tiles now (if -1 then it's removed)
      easyStar.setAcceptableTiles(tileIndexes.filter((tileIndex) => tileIndex !== TileDefinitions.tileRemoveIndex));

      /**
       * todo this should be only run once grid updates - manualTile + tileLayer + staticObject (building)
       */
      this.extractDirectionalConditionForGrid(easyStar, navigationGridWithProperties);

      if (this.enableDiagonals) {
        easyStar.enableDiagonals();
      }
      easyStar.findPath(from.x, from.y, to.x, to.y, (path) => {
        if (!path) {
          console.log("Path was not found.");
          reject("Path was not found.");
        } else {
          if (path.length === 0) {
            resolve([]);
            return;
          }
          // draw straight line from start to end colored red
          let graphics = this.scene.add.graphics();
          graphics.lineStyle(2, 0xff0000, 1);
          graphics.beginPath();
          let tileCenter = Pathfinder.DEPRECATED_getTileWorldCenterByPath(path[0]);
          graphics.moveTo(tileCenter.x, tileCenter.y);
          tileCenter = Pathfinder.DEPRECATED_getTileWorldCenterByPath(path[path.length - 1]);
          graphics.lineTo(tileCenter.x, tileCenter.y);
          graphics.strokePath();

          // draw phaser line from one point to the next
          graphics = this.scene.add.graphics();
          graphics.lineStyle(2, 0xffffff, 1);
          graphics.beginPath();
          tileCenter = Pathfinder.DEPRECATED_getTileWorldCenterByPath(path[0]);
          graphics.moveTo(tileCenter.x, tileCenter.y);

          const allTileWorldXYCentersWithoutFirst = path.map((path) =>
            Pathfinder.DEPRECATED_getTileWorldCenterByPath(path)
          );
          allTileWorldXYCentersWithoutFirst.shift();

          for (let i = 0; i < path.length - 1; i++) {
            tileCenter = allTileWorldXYCentersWithoutFirst[i];
            graphics.lineTo(tileCenter.x, tileCenter.y);
          }
          graphics.strokePath();

          // map all tileXYPathWithoutFirst to tilePlacementWorldWithProperties
          const tilePlacementWorldWithPropertiesPath = path.map(
            (tileXY) => navigationGridWithProperties[tileXY.y][tileXY.x]
          );
          resolve(tilePlacementWorldWithPropertiesPath);
        }
      });
      easyStar.calculate();
    });
  }

  /**
   * Calculates slope adjustment from current to next tile
   * This slope adjustment is used to calculate at which height the slope ends
   */
  private getSlopeAdjustmentForTile(
    currentTile: TilePlacementWorldWithProperties,
    nextTile: TilePlacementWorldWithProperties
  ): number {
    const nextTileXY = nextTile.tileWorldData.tileXY;
    const slopeStepHeightAdjustment = currentTile.tileLayerProperties.stepHeight ?? 0;

    let slopeAdjustment = 0;
    switch (currentTile.tileLayerProperties.slopeDir) {
      case SlopeDirection.SouthWest:
        // if next y is greater than current y, we're going down the slope
        if (nextTileXY.y === currentTile.tileWorldData.tileXY.y + 1) {
          slopeAdjustment = -slopeStepHeightAdjustment;
        } else if (nextTileXY.y === currentTile.tileWorldData.tileXY.y - 1) {
          slopeAdjustment = slopeStepHeightAdjustment;
        }
        break;
      case SlopeDirection.SouthEast:
        // if next x is greater than current x, we're going down the slope
        if (nextTileXY.x === currentTile.tileWorldData.tileXY.x + 1) {
          slopeAdjustment = -slopeStepHeightAdjustment;
        } else if (nextTileXY.x === currentTile.tileWorldData.tileXY.x - 1) {
          slopeAdjustment = slopeStepHeightAdjustment;
        }

        break;
      case SlopeDirection.NorthWest:
        // if next x is smaller than current x, we're going down the slope
        if (nextTileXY.x + 1 === currentTile.tileWorldData.tileXY.x) {
          slopeAdjustment = -slopeStepHeightAdjustment;
        } else if (nextTileXY.x - 1 === currentTile.tileWorldData.tileXY.x) {
          slopeAdjustment = slopeStepHeightAdjustment;
        }
        break;
      case SlopeDirection.NorthEast:
        // if next y is smaller than current y, we're going down the slope
        if (nextTileXY.y + 1 === currentTile.tileWorldData.tileXY.y) {
          slopeAdjustment = -slopeStepHeightAdjustment;
        } else if (nextTileXY.y - 1 === currentTile.tileWorldData.tileXY.y) {
          slopeAdjustment = slopeStepHeightAdjustment;
        }
        break;
    }
    return slopeAdjustment;
  }

  private getTileNeighbours = (
    tile: TilePlacementWorldWithProperties,
    navigationGridWithProperties: TilePlacementWorldWithProperties[][],
    options: { includeDiagonals: boolean }
  ): { neighbours: TilePlacementWorldWithProperties[]; directions: EasyStar_Direction[] } => {
    const { x, y } = tile.tileWorldData.tileXY;
    const { includeDiagonals } = options;

    const neighbours: TilePlacementWorldWithProperties[] = [];

    const directions: EasyStar_Direction[] = [];

    const top = navigationGridWithProperties[y - 1]?.[x];
    const bottom = navigationGridWithProperties[y + 1]?.[x];
    const left = navigationGridWithProperties[y]?.[x - 1];
    const right = navigationGridWithProperties[y]?.[x + 1];
    const topLeft = navigationGridWithProperties[y - 1]?.[x - 1];
    const topRight = navigationGridWithProperties[y - 1]?.[x + 1];
    const bottomLeft = navigationGridWithProperties[y + 1]?.[x - 1];
    const bottomRight = navigationGridWithProperties[y + 1]?.[x + 1];

    const isHeightDifferenceTolerable = (
      currentTile: TilePlacementWorldWithProperties,
      nextTile: TilePlacementWorldWithProperties
    ): boolean => {
      const currentTileLayer = currentTile.tileWorldData.z;
      const nextTileLayer = nextTile.tileWorldData.z;
      const currentTileHeight = currentTileLayer * MapSizeInfo.info.tileHeight;
      const nextTileHeight = nextTileLayer * MapSizeInfo.info.tileHeight;

      const slopeAdjustmentFrom = this.getSlopeAdjustmentForTile(currentTile, nextTile);
      const slopeAdjustmentTo = this.getSlopeAdjustmentForTile(nextTile, currentTile);

      const currentTileTotalStepHeight =
        currentTileHeight + (currentTile.tileLayerProperties.stepHeight ?? 0) + slopeAdjustmentFrom;
      const nextTotalStepHeight = nextTileHeight + (nextTile.tileLayerProperties.stepHeight ?? 0) + slopeAdjustmentTo;

      const stepHeightDifference = Math.abs(currentTileTotalStepHeight - nextTotalStepHeight);
      return stepHeightDifference <= this.maxNavigableStepHeightDiff;
    };

    if (top) {
      neighbours.push(top);
      const stepDiffTolerable = isHeightDifferenceTolerable(tile, top);
      if (stepDiffTolerable) {
        directions.push(EasyStar_TOP);
      }
    }
    if (bottom) {
      neighbours.push(bottom);
      const stepDiffTolerable = isHeightDifferenceTolerable(tile, bottom);
      if (stepDiffTolerable) {
        directions.push(EasyStar_BOTTOM);
      }
    }
    if (left) {
      neighbours.push(left);
      const stepDiffTolerable = isHeightDifferenceTolerable(tile, left);
      if (stepDiffTolerable) {
        directions.push(EasyStar_LEFT);
      }
    }
    if (right) {
      neighbours.push(right);
      const stepDiffTolerable = isHeightDifferenceTolerable(tile, right);
      if (stepDiffTolerable) {
        directions.push(EasyStar_RIGHT);
      }
    }
    if (includeDiagonals) {
      if (topLeft) {
        neighbours.push(topLeft);
        const stepDiffTolerable = isHeightDifferenceTolerable(tile, topLeft);
        if (stepDiffTolerable) {
          directions.push(EasyStar_TOP_LEFT);
        }
      }
      if (topRight) {
        neighbours.push(topRight);
        const stepDiffTolerable = isHeightDifferenceTolerable(tile, topRight);
        if (stepDiffTolerable) {
          directions.push(EasyStar_TOP_RIGHT);
        }
      }
      if (bottomLeft) {
        neighbours.push(bottomLeft);
        const stepDiffTolerable = isHeightDifferenceTolerable(tile, bottomLeft);
        if (stepDiffTolerable) {
          directions.push(EasyStar_BOTTOM_LEFT);
        }
      }
      if (bottomRight) {
        neighbours.push(bottomRight);
        const stepDiffTolerable = isHeightDifferenceTolerable(tile, bottomRight);
        if (stepDiffTolerable) {
          directions.push(EasyStar_BOTTOM_RIGHT);
        }
      }
    }
    return { neighbours, directions };
  };

  private extractDirectionalConditionForGrid(
    easyStar: EasyStar,
    navigationGridWithProperties: TilePlacementWorldWithProperties[][]
  ) {
    navigationGridWithProperties.forEach((row, y) => {
      row.forEach((tile, x) => {
        const { directions } = this.getTileNeighbours(tile, navigationGridWithProperties, {
          includeDiagonals: this.enableDiagonals
        });

        let nrDirections = directions.length;

        // optimization - don't set directional condition if this is edge/corner tile with all other tiles navigable
        if (
          (y === 0 && x === 0) ||
          (y === 0 && x === row.length - 1) ||
          (y === navigationGridWithProperties.length - 1 && x === 0) ||
          (y === navigationGridWithProperties.length - 1 && x === row.length - 1)
        ) {
          // corner node
          nrDirections += this.enableDiagonals ? 5 : 2;
        } else {
          if (y === 0 || y === navigationGridWithProperties.length - 1 || x === 0 || x === row.length - 1) {
            // edge node
            nrDirections += this.enableDiagonals ? 3 : 1;
          }
        }

        if (this.enableDiagonals ? nrDirections < 8 : nrDirections < 4) {
          easyStar.setDirectionalCondition(x, y, directions);
        }
      });
    });
  }

  /**
   * easyStar.setGrid
   */
  private updateNavigationGrid(map: unknown): number[][] {
    // todo
    // todo updates existing array with tileIndexes + atlasIndexes - in case some sprite is blocking the path - wall?
    return [];
  }

  /**
   * easyStar.setAcceptableTiles
   */
  private updateAcceptableTiles(map: unknown): number[] {
    // todo
    return [];
  }

  /**
   * easyStar.setDirectionalCondition
   */
  private updateDirectionalConditions(): { x: number; y: number; directions: EasyStar_Direction[] }[] {
    // todo
    // todo checks the 3d array and disallows movement in certain directions if there's a wall or cliff or stairs
    return [];
  }

  /**
   * easyStar.setTileCost
   */
  private updateTileCosts(): { x: number; y: number; cost: number }[] {
    // todo
    // todo checks certain tile types and reads what is tile types' default cost.
    return [];
  }

  /**
   * easyStar.setAdditionalPointCost
   */
  private updateAdditionalPointCosts(): { x: number; y: number; cost: number }[] {
    // todo if needed
    return [];
  }

  /**
   * easyStar.avoidAdditionalPoint
   */
  private updateAvoidAdditionalPoints(): Vector2Simple[] {
    // todo if needed
    return [];
  }
}
