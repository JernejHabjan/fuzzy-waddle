import * as Phaser from 'phaser';
import { Scene } from 'phaser';
import { IsoHelper } from '../iso/iso-helper';
import { MapSizeInfo } from '../const/map-size.info';
import { ManualTilesHelper } from '../manual-tiles/manual-tiles.helper';
import { TilemapHelper } from '../tilemap/tilemap.helper';
import { TilePlacementData } from '../input/tilemap/tilemap-input.handler';
import { PlaceableAtlasProperties } from '../placable-objects/static-object';

export class SpriteHelper{

  static placeSpriteOnTileXY(scene:Scene,tilePlacementData:TilePlacementData,  placeableAtlasProperties:PlaceableAtlasProperties): Phaser.GameObjects.Sprite {
    const tileXY = tilePlacementData.tileXY;
    const layer = tilePlacementData.z;
    const texture = placeableAtlasProperties.texture;
    const frame = placeableAtlasProperties.frame;

    const tileWorldXYCenter = TilemapHelper.adjustTileWorldWithVerticalOffset(IsoHelper.getWorldCenterXY(tileXY), {
      offsetInPx: layer * MapSizeInfo.info.tileHeight - MapSizeInfo.info.tileHeightHalf
    });

    // create object
    const sprite = scene.add.sprite(tileWorldXYCenter.x, tileWorldXYCenter.y, texture, frame);
    sprite.setInteractive();
    sprite.depth = ManualTilesHelper.getDepth(tileXY, tileWorldXYCenter, layer);

    this.rescaleSpriteToFitTile(sprite);
    return sprite;
  }

  private static rescaleSpriteToFitTile(sprite: Phaser.GameObjects.Sprite) {
    // if sprite is larger than 64x64, then we need to scale it down // TODO THIS IS FOR TEST
    const width = sprite.width;
    const height = sprite.height;
    const scale = Math.min(MapSizeInfo.info.tileWidthHalf / width, MapSizeInfo.info.tileHeightHalf / height);
    sprite.setScale(scale);
  }
}
