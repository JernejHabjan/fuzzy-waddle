import { BaseSpectator } from "@fuzzy-waddle/platform-game-sessions";
import type { BaseSpectatorData } from "@fuzzy-waddle/platform-game-sessions";

export class ProbableWaffleSpectator extends BaseSpectator<ProbableWaffleSpectatorData> {
  constructor(data?: ProbableWaffleSpectatorData) {
    super(data as ProbableWaffleSpectatorData);
  }
}

export interface ProbableWaffleSpectatorData extends BaseSpectatorData {
  displayName?: string;
}
