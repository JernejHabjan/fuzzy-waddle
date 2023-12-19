import { BaseUserInfo, GameInstance } from "@fuzzy-waddle/api-interfaces";

export interface BaseGameData<
  TCommunicator = any,
  TGameInstance extends GameInstance = GameInstance,
  TUserInfo extends BaseUserInfo = BaseUserInfo
> {
  gameInstance: TGameInstance;
  communicator: TCommunicator;
  user: TUserInfo;
}
