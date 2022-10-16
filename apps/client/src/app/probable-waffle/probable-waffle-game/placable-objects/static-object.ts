import { MapHelper } from '../map/map-helper';
import { Scene } from 'phaser';
import { TilePlacementData } from '../input/tilemap/tilemap-input.handler';
import { AtlasFrame } from '../gui/editor-drawer/atlas-loader.service';

export interface GameObjectPlayer {
  playerNumber: number;
}

export interface PlaceableObjectProperties {
  placeableAtlasProperties:PlaceableAtlasProperties;

  // cost: number; // todo
  // walk_directions // todo...
}

export interface PlaceableAtlasProperties{
  texture: string, frame: string
}


export interface PlaceableGameObject {
  tilePlacementData: TilePlacementData;  // todo what if it spans multiple tiles?
  placeableObjectProperties: PlaceableObjectProperties;
}

interface PlacedGameObject {
  spriteInstance: Phaser.GameObjects.Sprite,
  placeableObjectProperties: PlaceableObjectProperties;
}

// eslint-disable-next-line
export interface PlacedDynamicGameObject extends PlacedGameObject {
}

export interface PlacedStaticGameObject extends PlacedGameObject,PlaceableGameObject {
}

export interface PlayerPlaceableGameObject extends PlaceableGameObject {
  belongsToPlayer?:GameObjectPlayer;
}

export class StaticObjectHelper {
  constructor(private readonly mapHelper: MapHelper, private readonly scene: Scene) {}
  createStaticObjectLayer() {
    this.mapHelper.staticObjects = [];
  }

  placeObjectsOnMap(
    playerPlaceableGameObjects: PlayerPlaceableGameObject[]
  ) {
    // todo
  }
}
