import Vector3 = Phaser.Math.Vector3;
import { VisionStateEnum } from './vision-state-enum';
import { Actor } from '../../../entity/actor/actor';

export class VisionInfo {
  visibleTiles: Vector3[] = [];
  knownTiles: Vector3[] = [];

  constructor(public teamId: number) {}

  getStateForTile(tilePosition: Vector3): VisionStateEnum {
    return VisionStateEnum.Unknown; // todo
  }

  applyVisionForActor(actor: Actor) {
    // sets the vision state for all tiles in the actor's vision range
    // todo
  }
  resetVisionForActor(actor: Actor) {
    // sets the vision state for all tiles in the actor's vision range to unknown
    // todo
  }
}
