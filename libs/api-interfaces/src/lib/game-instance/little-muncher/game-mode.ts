import type { BaseData } from "../data";
import { LittleMuncherHillEnum } from "../../little-muncher/little-muncher";
import { BaseGameMode } from "../game-mode";

export interface LittleMuncherGameModeData extends BaseData {
  hill?: LittleMuncherHillEnum;
}

export class LittleMuncherGameMode extends BaseGameMode<LittleMuncherGameModeData> {
  constructor(data?: LittleMuncherGameModeData) {
    super(data as LittleMuncherGameModeData);
  }
}
