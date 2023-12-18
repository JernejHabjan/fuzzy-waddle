import { BaseData } from "../data";
import { BaseGameMode } from "../game-mode";
import { ProbableWaffleLevelData } from "../../probable-waffle/probable-waffle";

export interface ProbableWaffleGameModeData extends BaseData {
  level?: ProbableWaffleLevelData;
}

export class ProbableWaffleGameMode extends BaseGameMode<ProbableWaffleGameModeData> {
  constructor(data?: ProbableWaffleGameModeData) {
    super(data as ProbableWaffleGameModeData);
  }
}
