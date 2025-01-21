import { GameObjects, Scene } from "phaser";
import {
  TilePlacementData_old,
  TileWorldData_old
} from "../../world/managers/controllers/input/tilemap/tilemap-input.handler";
import { GameObjectsHelper } from "../../world/map/game-objects-helper";

export interface GameObjectPlayer {
  playerNumber: number;
}

export interface PlaceableObjectProperties_old {
  placeableAtlasProperties: PlaceableAtlasProperties_old;

  // cost: number; // todo
  // walk_directions // todo...
}

export interface PlaceableAtlasProperties_old {
  texture: string;
  frame: string;
}

export interface PlaceableGameObject_old {
  tilePlacementData: TilePlacementData_old; // todo what if it spans multiple tiles?
  placeableObjectProperties: PlaceableObjectProperties_old;
}

export interface PlacedGameObject {
  tileWorldData: TileWorldData_old;
  spriteInstance: GameObjects.Sprite;
  placeableObjectProperties: PlaceableObjectProperties_old;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PlayerPlaceableGameObject extends PlaceableGameObject_old {
  // belongsToPlayer?: GameObjectPlayer;
}

export class StaticObjectHelper {
  constructor(
    private readonly gameObjectsHelper: GameObjectsHelper,
    private readonly scene: Scene
  ) {}

  createStaticObjectLayer() {
    this.gameObjectsHelper.staticObjects = [];
  }

  placeRawSpriteObjectsOnMap(playerPlaceableGameObjects: PlayerPlaceableGameObject[]) {
    // todo
  }
}
