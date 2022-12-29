import { RepresentableActor } from '../characters/representable-actor';
import { TilePlacementData } from '../input/tilemap/tilemap-input.handler';

// used for actors that don't move
export abstract class Building extends RepresentableActor {
  // make it public constructor
  constructor(scene: Phaser.Scene, tilePlacementData: TilePlacementData) {
    super(scene, tilePlacementData);
  }
}
