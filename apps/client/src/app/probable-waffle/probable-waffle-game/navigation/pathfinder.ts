import { Direction as EasyStar_Direction, js as EasyStar } from 'easystarjs';
import * as Phaser from 'phaser';
import { TilemapHelper } from '../tilemap/tilemap.helper';
import { Vector2Simple } from '../math/intersection';
import { TilePlacementWorldWithProperties } from '../manual-tiles/manual-tiles.helper';
import { TileDefinitions } from '../const/map-size.info';

export class Pathfinder {
  constructor(private readonly scene: Phaser.Scene) {}

  private static getTileWorldCenterByPath(path: Vector2Simple): Vector2Simple {
    return TilemapHelper.getTileWorldCenterByTilemapTileXY(path, {
      centerOfTile: true
    });
  }

  find(from: Vector2Simple, to: Vector2Simple, navigationGridWithProperties:  TilePlacementWorldWithProperties[][]): Promise<TilePlacementWorldWithProperties[]> {
    return new Promise<TilePlacementWorldWithProperties[]>((resolve, reject) => {
      const easyStar = new EasyStar();


      // map only tileIndexes from navigationGrid
      const navigationGrid = navigationGridWithProperties.map((row) => row.map((tile) => tile.tileLayerProperties.tileIndex));

      easyStar.setGrid(navigationGrid);

      // const get distinct tile indexes from grid
      const tileIndexes: number[] = [...new Set(navigationGrid.flat())];

      // todo hardcoded to all existing tiles now (if -1 then it's removed)
      easyStar.setAcceptableTiles(tileIndexes.filter((tileIndex) => tileIndex !== TileDefinitions.tileRemoveIndex));
      // todo easyStar.setDirectionalCondition(from.x, from.y, [
      //   EasyStar_TOP,
      //   EasyStar_TOP_RIGHT,
      //   EasyStar_RIGHT,
      //   EasyStar_BOTTOM_RIGHT,
      //   EasyStar_BOTTOM,
      //   EasyStar_BOTTOM_LEFT,
      //   EasyStar_LEFT,
      //   EasyStar_TOP_LEFT
      // ]);

      easyStar.enableDiagonals();
      easyStar.findPath(from.x, from.y, to.x, to.y, (path) => {
        if (!path) {
          console.log('Path was not found.');
          reject('Path was not found.');
        } else {
          if(path.length===0){
            resolve([]);
            return;
          }
          // draw straight line from start to end colored red
          let graphics = this.scene.add.graphics();
          graphics.lineStyle(2, 0xff0000, 1);
          graphics.beginPath();
          let tileCenter = Pathfinder.getTileWorldCenterByPath(path[0]);
          graphics.moveTo(tileCenter.x, tileCenter.y);
          tileCenter = Pathfinder.getTileWorldCenterByPath(path[path.length - 1]);
          graphics.lineTo(tileCenter.x, tileCenter.y);
          graphics.strokePath();

          // draw phaser line from one point to the next
          graphics = this.scene.add.graphics();
          graphics.lineStyle(2, 0xffffff, 1);
          graphics.beginPath();
          tileCenter = Pathfinder.getTileWorldCenterByPath(path[0]);
          graphics.moveTo(tileCenter.x, tileCenter.y);

          const allTileWorldXYCentersWithoutFirst = path.map((path) => Pathfinder.getTileWorldCenterByPath(path));
          allTileWorldXYCentersWithoutFirst.shift();

          for (let i = 0; i < path.length - 1; i++) {
            tileCenter = allTileWorldXYCentersWithoutFirst[i];
            graphics.lineTo(tileCenter.x, tileCenter.y);
          }
          graphics.strokePath();

          // map all tileXYPathWithoutFirst to tilePlacementWorldWithProperties
          const tilePlacementWorldWithPropertiesPath = path.map((tileXY) => navigationGridWithProperties[tileXY.y][tileXY.x]);
          resolve(tilePlacementWorldWithPropertiesPath);
        }
      });
      easyStar.calculate();
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
