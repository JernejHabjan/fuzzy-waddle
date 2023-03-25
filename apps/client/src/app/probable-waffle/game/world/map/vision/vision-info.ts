import { VisionStateEnum } from './vision-state-enum';
import { Actor } from '../../../entity/actor/actor';

export class VisionInfo {
  visibleTiles: Phaser.Math.Vector3[] = [];
  knownTiles: Phaser.Math.Vector3[] = [];

  constructor(public teamId: number) {}

  getStateForTile(tilePosition: Phaser.Math.Vector3): VisionStateEnum {
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
