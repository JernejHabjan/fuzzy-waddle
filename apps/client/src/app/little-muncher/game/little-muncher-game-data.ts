import type { BaseGameData } from "@fuzzy-waddle/platform-game-host/phaser/game/base-game-data";
import { LittleMuncherGameInstance, LittleMuncherUserInfo } from "@fuzzy-waddle/api-interfaces";
import { LittleMuncherCommunicatorService } from "../main/communicators/little-muncher-communicator.service";

export type LittleMuncherGameData = BaseGameData<
  LittleMuncherCommunicatorService,
  LittleMuncherGameInstance,
  LittleMuncherUserInfo
>;
