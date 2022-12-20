import { MapHelper } from '../map/map-helper';
import { Scene } from 'phaser';
import { PlayerPlaceableGameObject } from './static-object';
import { SpriteHelper } from '../sprite/sprite-helper';
import { IsoHelper } from '../iso/iso-helper';

export class DynamicObjectHelper {
  constructor(private readonly mapHelper: MapHelper, private readonly scene: Scene) {}
  createDynamicObjectLayer() {
    this.mapHelper.dynamicObjects = [];
  }

  placeRawSpriteObjectsOnMap(playerPlaceableGameObjects: PlayerPlaceableGameObject[]) {
    // todo
    playerPlaceableGameObjects.forEach((p) => {
      const spriteInstance = SpriteHelper.placeSpriteOnTileXY(
        this.scene,
        p.tilePlacementData,
        p.placeableObjectProperties.placeableAtlasProperties
      );
      this.mapHelper.dynamicObjects.push({
        tileWorldData: {
          tileXY: p.tilePlacementData.tileXY,
          z: p.tilePlacementData.z,
          worldXY: IsoHelper.isometricTileToWorldXY(p.tilePlacementData.tileXY)
        },
        placeableObjectProperties: p.placeableObjectProperties,
        spriteInstance
      });
    });
  }
}
