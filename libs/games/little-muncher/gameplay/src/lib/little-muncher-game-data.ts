import type { BaseGameData } from "@fuzzy-waddle/platform-game-host/phaser/game/base-game-data";
import { LittleMuncherGameInstance, LittleMuncherUserInfo } from "@fuzzy-waddle/api-interfaces";
import { LittleMuncherCommunicator } from "./communicators/little-muncher-communicator";

export type LittleMuncherGameData = BaseGameData<
  LittleMuncherCommunicator,
  LittleMuncherGameInstance,
  LittleMuncherUserInfo
>;
