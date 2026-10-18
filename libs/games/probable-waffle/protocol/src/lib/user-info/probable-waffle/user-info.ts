import { BaseUserInfo } from "@fuzzy-waddle/platform-game-sessions";
import type { PlayerNumber, UserId } from "@fuzzy-waddle/platform-game-sessions";

export class ProbableWaffleUserInfo extends BaseUserInfo {
  /**
   * Current player number of human player
   */
  playerNumber?: PlayerNumber;
  constructor(userId: UserId | null, playerNumber?: PlayerNumber) {
    super(userId);
    this.playerNumber = playerNumber;
  }
}
