import { GameObjects, Scene } from "phaser";
import { IsoHelper } from "../../world/map/tile/iso-helper";
import { MapSizeInfo_old } from "../../world/const/map-size.info_old";
import { TilemapHelper_old } from "../../world/map/tile/tilemapHelper_old";
import { TilePlacementData_old } from "../../world/managers/controllers/input/tilemap/tilemap-input.handler";
import { PlaceableAtlasProperties_old } from "../placable-objects/static-object";
import { Vector2Simple } from "@fuzzy-waddle/api-interfaces";

export type SpritePlacementData = {
  textureName: string;
  tilePlacementData: TilePlacementData_old;
};

export type SpriteWorldPlacementInfo_old = {
  depth: number;
} & Vector2Simple;

export class SpriteHelper_old {
  static getSpriteWorldPlacementInfo(tilePlacementData: TilePlacementData_old): SpriteWorldPlacementInfo_old {
    const tileXY = tilePlacementData.tileXY;
    const layer = tilePlacementData.z;

    const tileWorldXYCenter = TilemapHelper_old.adjustTileWorldWithVerticalOffset_old(
      IsoHelper.getWorldCenterXY(tileXY),
      {
        offsetInPx: layer * MapSizeInfo_old.info.tileHeight - MapSizeInfo_old.info.tileHeightHalf
      }
    );

    // create object

    const depth = 0;
    return {
      x: tileWorldXYCenter.x,
      y: tileWorldXYCenter.y,
      depth
    };
  }

  static placeSpriteOnTileXY_old(
    scene: Scene,
    tilePlacementData: TilePlacementData_old,
    placeableAtlasProperties: PlaceableAtlasProperties_old
  ): GameObjects.Sprite {
    const texture = placeableAtlasProperties.texture;
    const frame = placeableAtlasProperties.frame;

    const spriteWorldPlacementInfo = SpriteHelper_old.getSpriteWorldPlacementInfo(tilePlacementData);
    // create object
    const sprite = scene.add.sprite(spriteWorldPlacementInfo.x, spriteWorldPlacementInfo.y, texture, frame);
    sprite.setInteractive();
    sprite.depth = spriteWorldPlacementInfo.depth;

    const [imageName] = frame.split(".");

    this.rescaleSpriteToFitTile_old(sprite);

    return sprite;
  }

  private static rescaleSpriteToFitTile_old(sprite: GameObjects.Sprite) {
    // if sprite is larger than 64x64, then we need to scale it down // TODO THIS IS FOR TEST
    const width = sprite.width;
    const height = sprite.height;
    const scale = Math.min(MapSizeInfo_old.info.tileWidthHalf / width, MapSizeInfo_old.info.tileHeightHalf / height);
    sprite.setScale(scale);
  }
}
