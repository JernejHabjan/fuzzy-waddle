import { js as EasyStar } from 'easystarjs';
import * as Phaser from 'phaser';
import { TilemapHelper } from '../tilemap/tilemap.helper';
import { Vector2Simple } from '../math/intersection';

export class Pathfinder {
  private scene: Phaser.Scene; // todo should not be used like this
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  private static getTileCenterByPath(path: Vector2Simple, tilemapLayer: Phaser.Tilemaps.TilemapLayer): Vector2Simple {
    const center = TilemapHelper.getTileCenterByTilemapTileXY(path.x, path.y, tilemapLayer, {
      centerSprite: true
    });
    if (center == null) {
      throw new Error('center is null');
    }
    return center;
  }

  find(from: Vector2Simple, to: Vector2Simple, tilemapLayer: Phaser.Tilemaps.TilemapLayer) {
    const easyStar = new EasyStar();
    const grid = tilemapLayer.layer.data.map((row: Phaser.Tilemaps.Tile[]) => row.map((tile) => tile.index));
    easyStar.setGrid(grid);
    easyStar.setAcceptableTiles([1]); // todo hardcoded to green tiles now
    easyStar.enableDiagonals();
    easyStar.findPath(from.x, from.y, to.x, to.y, (path) => {
      if (path === null) {
        console.log('Path was not found.');
      } else {
        // draw straight line from start to end colored red
        let graphics = this.scene.add.graphics();
        graphics.lineStyle(2, 0xff0000, 1);
        graphics.beginPath();
        let tileCenter = Pathfinder.getTileCenterByPath(path[0], tilemapLayer);
        graphics.moveTo(tileCenter.x, tileCenter.y);
        tileCenter = Pathfinder.getTileCenterByPath(path[path.length - 1], tilemapLayer);
        graphics.lineTo(tileCenter.x, tileCenter.y);
        graphics.strokePath();

        // draw phaser line from one point to the next
        graphics = this.scene.add.graphics();
        graphics.lineStyle(2, 0xffffff, 1);
        graphics.beginPath();
        tileCenter = Pathfinder.getTileCenterByPath(path[0], tilemapLayer);
        graphics.moveTo(tileCenter.x, tileCenter.y);
        for (let i = 1; i < path.length; i++) {
          tileCenter = Pathfinder.getTileCenterByPath(path[i], tilemapLayer);
          graphics.lineTo(tileCenter.x, tileCenter.y);
        }
        graphics.strokePath();
      }
    });
    easyStar.calculate();
  }
}
