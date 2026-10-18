import { type BaseData, BaseGameMode } from "@fuzzy-waddle/platform-game-sessions";
import { LittleMuncherHillEnum } from "../../little-muncher/little-muncher";

export interface LittleMuncherGameModeData extends BaseData {
  hill?: LittleMuncherHillEnum;
}

export class LittleMuncherGameMode extends BaseGameMode<LittleMuncherGameModeData> {
  constructor(data?: LittleMuncherGameModeData) {
    super(data as LittleMuncherGameModeData);
  }
}
