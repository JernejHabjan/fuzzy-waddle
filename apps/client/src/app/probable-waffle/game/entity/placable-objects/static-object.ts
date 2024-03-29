import { GameObjects, Scene } from "phaser";
import { TilePlacementData, TileWorldData } from "../../world/managers/controllers/input/tilemap/tilemap-input.handler";
import { GameObjectsHelper } from "../../world/map/game-objects-helper";

export interface GameObjectPlayer {
  playerNumber: number;
}

export interface PlaceableObjectProperties {
  placeableAtlasProperties: PlaceableAtlasProperties;

  // cost: number; // todo
  // walk_directions // todo...
}

export interface PlaceableAtlasProperties {
  texture: string;
  frame: string;
}

export interface PlaceableGameObject {
  tilePlacementData: TilePlacementData; // todo what if it spans multiple tiles?
  placeableObjectProperties: PlaceableObjectProperties;
}

export interface PlacedGameObject {
  tileWorldData: TileWorldData;
  spriteInstance: GameObjects.Sprite;
  placeableObjectProperties: PlaceableObjectProperties;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PlayerPlaceableGameObject extends PlaceableGameObject {
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
