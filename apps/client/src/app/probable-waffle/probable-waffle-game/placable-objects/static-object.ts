import { MapHelper } from '../map/map-helper';
import { Scene } from 'phaser';
import { TilePlacementData, TileWorldData } from '../input/tilemap/tilemap-input.handler';

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
  spriteInstance: Phaser.GameObjects.Sprite;
  placeableObjectProperties: PlaceableObjectProperties;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PlayerPlaceableGameObject extends PlaceableGameObject {
  // belongsToPlayer?: GameObjectPlayer;
}

export class StaticObjectHelper {
  constructor(private readonly mapHelper: MapHelper, private readonly scene: Scene) {}
  createStaticObjectLayer() {
    this.mapHelper.staticObjects = [];
  }

  placeRawSpriteObjectsOnMap(playerPlaceableGameObjects: PlayerPlaceableGameObject[]) {
    // todo
  }
}
