import { BaseUserInfo } from "../user-info";

export class ProbableWaffleUserInfo extends BaseUserInfo {
  playerNumber?: number;
  constructor(userId: string | null, playerNumber?: number) {
    super(userId);
    this.playerNumber = playerNumber;
  }
}
