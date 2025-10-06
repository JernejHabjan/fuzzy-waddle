import { BaseSpectator } from "../spectator";
import type { BaseSpectatorData } from "../spectator";

export class ProbableWaffleSpectator extends BaseSpectator<ProbableWaffleSpectatorData> {
  constructor(data?: ProbableWaffleSpectatorData) {
    super(data as ProbableWaffleSpectatorData);
  }
}

export interface ProbableWaffleSpectatorData extends BaseSpectatorData {}
