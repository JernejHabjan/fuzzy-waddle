import { PlayerController } from './player-controller';

export class AiPlayerController extends PlayerController {
  getNextBuildingToProduce() {
    throw new Error('Not implemented');
  }

  /**
   * Whether killing an actor owned by this player yields a reward for the attacking player
   */
  givesBounty() {
    throw new Error('Not implemented');
  }
}
