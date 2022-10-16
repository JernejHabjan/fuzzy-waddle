import { MapHelper } from '../map/map-helper';
import { Scene } from 'phaser';
import { TilePlacementData } from '../input/tilemap/tilemap-input.handler';
import { PlaceableGameObject, PlayerPlaceableGameObject } from './static-object';
import { SpriteHelper } from '../sprite/sprite-helper';
import { MapDefinitions } from '../const/map-size.info';


export class DynamicObjectHelper {
  constructor(private readonly mapHelper: MapHelper, private readonly scene: Scene) {}
  createDynamicObjectLayer() {
    this.mapHelper.dynamicObjects = [];
  }

  placeObjectsOnMap(
    playerPlaceableGameObjects: PlayerPlaceableGameObject[]
) {
    // todo
    playerPlaceableGameObjects.forEach((p) => {


    const spriteInstance = SpriteHelper.placeSpriteOnTileXY(
      this.scene,
      p.tilePlacementData,
      p.placeableObjectProperties.placeableAtlasProperties
    );
    this.mapHelper.dynamicObjects.push({
      placeableObjectProperties: p.placeableObjectProperties,
       spriteInstance,
    });
    });
  }
}
