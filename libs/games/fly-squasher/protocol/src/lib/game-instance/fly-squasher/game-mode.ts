import { type BaseData, BaseGameMode } from "@fuzzy-waddle/platform-game-sessions";
import type { FlySquasherLevelData } from "../../fly-squasher/fly-squasher";

export interface FlySquasherGameModeData extends BaseData {
  level?: FlySquasherLevelData;
}

export class FlySquasherGameMode extends BaseGameMode<FlySquasherGameModeData> {
  constructor(data?: FlySquasherGameModeData) {
    super(data as FlySquasherGameModeData);
  }
}
