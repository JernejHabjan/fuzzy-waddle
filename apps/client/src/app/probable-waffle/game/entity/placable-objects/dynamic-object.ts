import { Scene } from 'phaser';
import { PlayerPlaceableGameObject } from './static-object';
import { SpriteHelper } from '../actor/sprite-helper';
import { IsoHelper } from '../../world/map/tile/iso-helper';
import { GameObjectsHelper } from '../../world/map/game-objects-helper';

export class DynamicObjectHelper {
  constructor(private readonly gameObjectsHelper: GameObjectsHelper, private readonly scene: Scene) {}
  createDynamicObjectLayer() {
    this.gameObjectsHelper.dynamicObjects = [];
  }

  placeRawSpriteObjectsOnMap(playerPlaceableGameObjects: PlayerPlaceableGameObject[]) {
    // todo
    playerPlaceableGameObjects.forEach((p) => {
      const spriteInstance = SpriteHelper.placeSpriteOnTileXY(
        this.scene,
        p.tilePlacementData,
        p.placeableObjectProperties.placeableAtlasProperties
      );
      this.gameObjectsHelper.dynamicObjects.push({
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
