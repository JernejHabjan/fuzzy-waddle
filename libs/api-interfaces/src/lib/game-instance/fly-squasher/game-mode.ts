import { BaseData } from "../data";
import { BaseGameMode } from "../game-mode";
import { LevelData } from "../../fly-squasher/fly-squasher";

export interface FlySquasherGameModeData extends BaseData {
  level?: LevelData;
}

export class FlySquasherGameMode extends BaseGameMode<FlySquasherGameModeData> {
  constructor(data?: FlySquasherGameModeData) {
    super(data as FlySquasherGameModeData);
  }
}
