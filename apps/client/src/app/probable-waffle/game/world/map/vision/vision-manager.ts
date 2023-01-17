import { VisionInfo } from './vision-info';
import { Actor } from '../../../entity/actor/actor';

export class VisionManager {
  private visionInfo?: VisionInfo;

  /**
   * Sets the vision info to use for the local player.
   */
  setLocalVisionInfo(visionInfo: VisionInfo) {
    this.visionInfo = visionInfo;
  }

  /**
   * Registers the specified actor for updating its own visibility
   */
  addVisibleActor(actor: Actor) {
    // pass
  }
  RemoveVisibleActor(actor: Actor) {
    // pass
  }

  /**
   * Registers the specified actor for updating team vision
   */
  AddVisionActor(actor: Actor) {
    // pass
  }
  RemoveVisionActor(actor: Actor) {
    // pass
  }
}
