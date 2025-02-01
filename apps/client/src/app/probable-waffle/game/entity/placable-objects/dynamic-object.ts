import { Scene } from "phaser";
import { PlayerPlaceableGameObject } from "./static-object";
import { SpriteHelper_old } from "../actor/sprite-helper_old";
import { IsoHelper } from "../../world/map/tile/iso-helper";
import { GameObjectsHelper } from "../../world/map/game-objects-helper";

export class DynamicObjectHelper_old {
  constructor(
    private readonly gameObjectsHelper: GameObjectsHelper,
    private readonly scene: Scene
  ) {}

  createDynamicObjectLayer_old() {
    this.gameObjectsHelper.dynamicObjects = [];
  }

  placeRawSpriteObjectsOnMap_old(playerPlaceableGameObjects: PlayerPlaceableGameObject[]) {
    // todo
    playerPlaceableGameObjects.forEach((p) => {
      const spriteInstance = SpriteHelper_old.placeSpriteOnTileXY_old(
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
