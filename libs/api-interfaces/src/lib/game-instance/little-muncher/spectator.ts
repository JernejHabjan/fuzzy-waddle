import { BaseSpectator, BaseSpectatorData } from "../spectator";

export class LittleMuncherSpectator extends BaseSpectator<LittleMuncherSpectatorData> {
  constructor(data?: LittleMuncherSpectatorData) {
    super(data as LittleMuncherSpectatorData);
  }
}

export interface LittleMuncherSpectatorData extends BaseSpectatorData {}
