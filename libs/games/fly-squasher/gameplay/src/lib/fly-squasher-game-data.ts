import { type BaseGameData } from "@fuzzy-waddle/platform-game-host/phaser/game/base-game-data";
import { FlySquasherGameInstance, FlySquasherUserInfo } from "@fuzzy-waddle/fly-squasher-protocol";
import { FlySquasherCommunicatorService } from "./fly-squasher-communicator.service";

export type FlySquasherGameData = BaseGameData<
  FlySquasherCommunicatorService,
  FlySquasherGameInstance,
  FlySquasherUserInfo
>;
