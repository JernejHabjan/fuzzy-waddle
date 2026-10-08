import { BasePlayerController } from "@fuzzy-waddle/platform-game-sessions";
import type { ProbableWafflePlayerControllerData } from "./probable-waffle-player-controller-data";

export class ProbableWafflePlayerController extends BasePlayerController<ProbableWafflePlayerControllerData> {
  constructor(data?: ProbableWafflePlayerControllerData) {
    super(data as ProbableWafflePlayerControllerData);
  }
}
