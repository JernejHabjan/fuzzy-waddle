import { BaseUserInfo, GameInstance } from "@fuzzy-waddle/platform-game-sessions";
import type { CommunicatorService } from "../../communicators/CommunicatorService";

export interface BaseGameData<
  TCommunicator extends CommunicatorService = CommunicatorService,
  TGameInstance extends GameInstance = GameInstance,
  TUserInfo extends BaseUserInfo = BaseUserInfo
> {
  gameInstance: TGameInstance;
  communicator: TCommunicator;
  components: any[];
  user: TUserInfo;
}
