import { BaseSpectator, type BaseSpectatorData } from "@fuzzy-waddle/platform-game-sessions";

export class FlySquasherSpectator extends BaseSpectator<FlySquasherSpectatorData> {
  constructor(data?: FlySquasherSpectatorData) {
    super(data as FlySquasherSpectatorData);
  }
}

export interface FlySquasherSpectatorData extends BaseSpectatorData {}
