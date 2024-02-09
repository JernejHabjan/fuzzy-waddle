import { BaseGameData } from "../../shared/game/phaser/game/base-game-data";
import { FlySquasherGameInstance, FlySquasherUserInfo } from "@fuzzy-waddle/api-interfaces";
import { FlySquasherCommunicatorService } from "./fly-squasher-communicator.service";

export type FlySquasherGameData = BaseGameData<
  FlySquasherCommunicatorService,
  FlySquasherGameInstance,
  FlySquasherUserInfo
>;
