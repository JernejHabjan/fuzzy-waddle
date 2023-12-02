import { BaseGameData } from "../../shared/game/phaser/game/base-game-data";
import { LittleMuncherCommunicatorService } from "./little-muncher-communicator.service";
import { LittleMuncherGameInstance, LittleMuncherUserInfo } from "@fuzzy-waddle/api-interfaces";

export type LittleMuncherGameData = BaseGameData<
  LittleMuncherCommunicatorService,
  LittleMuncherGameInstance,
  LittleMuncherUserInfo
>;
