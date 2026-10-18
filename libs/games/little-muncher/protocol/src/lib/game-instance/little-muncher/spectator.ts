import { BaseSpectator, type BaseSpectatorData } from "@fuzzy-waddle/platform-game-sessions";

export class LittleMuncherSpectator extends BaseSpectator<LittleMuncherSpectatorData> {
  constructor(data?: LittleMuncherSpectatorData) {
    super(data as LittleMuncherSpectatorData);
  }
}

export interface LittleMuncherSpectatorData extends BaseSpectatorData {}
