import { BaseSpectator, BaseSpectatorData } from "../spectator";

export class FlySquasherSpectator extends BaseSpectator<FlySquasherSpectatorData> {
  constructor(data?: FlySquasherSpectatorData) {
    super(data as FlySquasherSpectatorData);
  }
}

export interface FlySquasherSpectatorData extends BaseSpectatorData {}
