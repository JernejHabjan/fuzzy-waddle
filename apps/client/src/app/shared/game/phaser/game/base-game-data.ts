import { BaseUserInfo, GameInstance } from "@fuzzy-waddle/api-interfaces";
import { LittleMuncherCommunicatorService } from "../../../../little-muncher/game/little-muncher-communicator.service";

export interface BaseGameData<
  TCommunicator = any,
  TGameInstance extends GameInstance = GameInstance,
  TUserInfo extends BaseUserInfo = BaseUserInfo
> {
  gameInstance: TGameInstance;
  communicator: TCommunicator;
  user: TUserInfo;
}
