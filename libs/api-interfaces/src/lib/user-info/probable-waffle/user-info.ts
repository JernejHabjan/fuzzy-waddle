import { BaseUserInfo } from "../user-info";
import type { PlayerNumber, UserId } from "../../game-instance/player/player";

export class ProbableWaffleUserInfo extends BaseUserInfo {
  /**
   * Current player number of human player
   */
  playerNumber?: PlayerNumber;
  constructor(userId: UserId | null, playerNumber?: number) {
    super(userId);
    this.playerNumber = playerNumber;
  }
}
