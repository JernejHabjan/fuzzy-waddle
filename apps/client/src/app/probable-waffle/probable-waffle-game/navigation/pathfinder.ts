import { js as EasyStar } from 'easystarjs';
import * as Phaser from 'phaser';
import { TilemapHelper } from '../tilemap/tilemap.helper';
import { Vector2Simple } from '../math/intersection';

export class Pathfinder {
  private scene: Phaser.Scene; // todo should not be used like this
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  private static getTileWorldCenterByPath(path: Vector2Simple): Vector2Simple {
    return TilemapHelper.getTileWorldCenterByTilemapTileXY(path, {
      centerOfTile: true
    });
  }

  find(from: Vector2Simple, to: Vector2Simple, navigationGrid: number[][]): Promise<Vector2Simple[]> {
    return new Promise<Vector2Simple[]>((resolve, reject) => {
      const easyStar = new EasyStar();
      easyStar.setGrid(navigationGrid);

      // const get distinct tile indexes from grid
      const tileIndexes: number[] = [...new Set(navigationGrid.flat())];

      easyStar.setAcceptableTiles(tileIndexes); // todo hardcoded to all tiles now
      easyStar.enableDiagonals();
      easyStar.findPath(from.x, from.y, to.x, to.y, (path) => {
        if (!path) {
          console.log('Path was not found.');
          reject('Path was not found.');
        } else {
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

          // callback
          const tileXYPathWithoutFirst = path.map((path) => path);
          tileXYPathWithoutFirst.shift();
          resolve(tileXYPathWithoutFirst);
        }
      });
      easyStar.calculate();
    });
  }
}
