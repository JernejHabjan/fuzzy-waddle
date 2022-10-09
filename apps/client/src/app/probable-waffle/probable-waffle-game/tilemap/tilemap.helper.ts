import * as Phaser from 'phaser';
import { MapSizeInfo } from '../const/map-size.info';
import { TileCenterOptions } from '../types/tile-types';
import { Vector2Simple } from '../math/intersection';
import { IsoHelper } from '../iso/iso-helper';

export class TilemapHelper {
  private scene: Phaser.Scene; // todo should not be used like this

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  static getTileCenter(x: number, y: number, tileCenterOptions: TileCenterOptions = null): Vector2Simple {
    const centerX = x;
    const centerY =
      y +
      (tileCenterOptions?.offset
        ? -tileCenterOptions.offset
        : tileCenterOptions?.centerSprite
        ? MapSizeInfo.info.tileHeight / 2
        : 0);
    return { x: centerX, y: centerY };
  }

  static getTileCenterByTilemapTileXY(
    tileXY:Vector2Simple,
    tileCenterOptions: TileCenterOptions = null
  ): Vector2Simple | null {
    return this.getTileCenter(IsoHelper.getCenterX(tileXY.x,tileXY.y),  IsoHelper.getCenterY(tileXY.x,tileXY.y), tileCenterOptions);
  }

  placeSpriteOnTileXY(tileXY:Vector2Simple): Phaser.GameObjects.Sprite {
    const tileCenter = TilemapHelper.getTileCenter(IsoHelper.getCenterX(tileXY.x,tileXY.y),  IsoHelper.getCenterY(tileXY.x,tileXY.y), {
      centerSprite: true
    });

    // create object
    const sprite = this.scene.add.sprite(tileCenter.x, tileCenter.y, 'atlas', 'blue_ball');
    // todo set object depth!
    sprite.setInteractive();
    // todo temp
    sprite.setScale(1, 1);
    return sprite;
  }
}
