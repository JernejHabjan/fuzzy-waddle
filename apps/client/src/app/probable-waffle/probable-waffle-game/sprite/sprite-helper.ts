import * as Phaser from 'phaser';
import { Scene } from 'phaser';
import { IsoHelper } from '../iso/iso-helper';
import { MapSizeInfo } from '../const/map-size.info';
import { ManualTilesHelper } from '../manual-tiles/manual-tiles.helper';
import { TilemapHelper } from '../tilemap/tilemap.helper';
import { TilePlacementData } from '../input/tilemap/tilemap-input.handler';
import { PlaceableAtlasProperties } from '../placable-objects/static-object';
import { Warrior1 } from '../characters/warrior1';
import { Vector2Simple } from '../math/intersection';

export type SpriteWorldPlacementInfo = {
  depth: number;
} & Vector2Simple;

export class SpriteHelper {

  static getSpriteWorldPlacementInfo(tilePlacementData: TilePlacementData): SpriteWorldPlacementInfo {
    const tileXY = tilePlacementData.tileXY;
    const layer = tilePlacementData.z;

    const tileWorldXYCenter = TilemapHelper.adjustTileWorldWithVerticalOffset(IsoHelper.getWorldCenterXY(tileXY), {
      offsetInPx: layer * MapSizeInfo.info.tileHeight - MapSizeInfo.info.tileHeightHalf
    });

    // create object

    const depth = ManualTilesHelper.getDepth(tileXY, tileWorldXYCenter, layer);
    return {
      x: tileWorldXYCenter.x,
      y: tileWorldXYCenter.y,
      depth
    };
  }

  static placeSpriteOnTileXY(
    scene: Scene,
    tilePlacementData: TilePlacementData,
    placeableAtlasProperties: PlaceableAtlasProperties
  ): Phaser.GameObjects.Sprite {
    const texture = placeableAtlasProperties.texture;
    const frame = placeableAtlasProperties.frame;

    const spriteWorldPlacementInfo = SpriteHelper.getSpriteWorldPlacementInfo(tilePlacementData);
    // create object
    const sprite = scene.add.sprite(spriteWorldPlacementInfo.x, spriteWorldPlacementInfo.y, texture, frame);
    sprite.setInteractive();
    sprite.depth = spriteWorldPlacementInfo.depth;

    const [imageName] = frame.split('.');
    if (imageName === Warrior1.textureName) {
      // todo
      this.placeSpriteAsIs(sprite);
    } else if (imageName === 'barracks') {
      // todo just for test
      this.rescaleSpriteToFitTwoTiles(sprite);
    } else {
      this.rescaleSpriteToFitTile(sprite);
    }
    return sprite;
  }

  private static rescaleSpriteToFitTile(sprite: Phaser.GameObjects.Sprite) {
    // if sprite is larger than 64x64, then we need to scale it down // TODO THIS IS FOR TEST
    const width = sprite.width;
    const height = sprite.height;
    const scale = Math.min(MapSizeInfo.info.tileWidthHalf / width, MapSizeInfo.info.tileHeightHalf / height);
    sprite.setScale(scale);
  }

  private static rescaleSpriteToFitTwoTiles(sprite: Phaser.GameObjects.Sprite) {
    // todo just for test
    const width = sprite.width;
    const scale = MapSizeInfo.info.tileWidth / width;
    sprite.setScale(scale * 2);
    // offset sprite on x and y by 10
    sprite.x -= 5; // offset so it looks nice
    sprite.y -= 7; // offset so it looks nice
  }

  private static placeSpriteAsIs(sprite: Phaser.GameObjects.Sprite) {
    // todo?
    sprite.y -= MapSizeInfo.info.tileHeightHalf + MapSizeInfo.info.tileHeightHalf / 4;
  }
}
