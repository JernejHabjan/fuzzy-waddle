import { BaseData } from "../data";
import { BaseGameMode } from "../game-mode";
import { FlySquasherLevelData } from "../../fly-squasher/fly-squasher";

export interface FlySquasherGameModeData extends BaseData {
  level?: FlySquasherLevelData;
}

export class FlySquasherGameMode extends BaseGameMode<FlySquasherGameModeData> {
  constructor(data?: FlySquasherGameModeData) {
    super(data as FlySquasherGameModeData);
  }
}
