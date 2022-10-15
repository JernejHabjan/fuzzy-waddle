import * as Phaser from 'phaser';
import { MapSizeInfo } from '../const/map-size.info';
import { TileCenterOptions } from '../types/tile-types';
import { Vector2Simple } from '../math/intersection';
import { IsoHelper } from '../iso/iso-helper';
import { ManualTilesHelper } from '../manual-tiles/manual-tiles.helper';

export class TilemapHelper {
  private scene: Phaser.Scene; // todo should not be used like this

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  static adjustTileWorldWithVerticalOffset(
    tileXY: Vector2Simple,
    tileCenterOptions: TileCenterOptions = null
  ): Vector2Simple {
    if (tileCenterOptions?.offsetInPx) {
      return { x: tileXY.x, y: tileXY.y - tileCenterOptions.offsetInPx };
    }
    if (tileCenterOptions?.centerOfTile) {
      return { x: tileXY.x, y: tileXY.y + TilemapHelper.tileCenterOffset };
    }
    return tileXY;
  }

  static get tileCenterOffset(): number {
    return MapSizeInfo.info.tileHeightHalf;
  }

  static getTileWorldCenterByTilemapTileXY(
    tileXY: Vector2Simple,
    tileCenterOptions: TileCenterOptions = null
  ): Vector2Simple {
    return this.adjustTileWorldWithVerticalOffset(IsoHelper.getWorldCenterXY(tileXY), tileCenterOptions);
  }

  placeSpriteOnTileXY(tileXY: Vector2Simple, texture: string, frame: string, layer: number): Phaser.GameObjects.Sprite {
    const tileWorldXYCenter = TilemapHelper.adjustTileWorldWithVerticalOffset(IsoHelper.getWorldCenterXY(tileXY), {
      offsetInPx: layer * MapSizeInfo.info.tileHeight - MapSizeInfo.info.tileHeightHalf
    });

    // create object
    const sprite = this.scene.add.sprite(tileWorldXYCenter.x, tileWorldXYCenter.y, texture, frame);
    sprite.setInteractive();
    sprite.depth = ManualTilesHelper.getDepth(tileXY, tileWorldXYCenter, layer);

    this.rescaleSpriteToFitTile(sprite);
    return sprite;
  }

  private rescaleSpriteToFitTile(sprite: Phaser.GameObjects.Sprite) {
    // if sprite is larger than 64x64, then we need to scale it down // TODO THIS IS FOR TEST
    const width = sprite.width;
    const height = sprite.height;
    const scale = Math.min(MapSizeInfo.info.tileWidthHalf / width, MapSizeInfo.info.tileHeightHalf / height);
    sprite.setScale(scale);
  }
}
