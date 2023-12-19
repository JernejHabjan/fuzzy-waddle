import { BaseData } from "../data";
import { BaseGameMode } from "../game-mode";
import { ProbableWaffleLevelEnum } from "../../probable-waffle/probable-waffle";

export interface ProbableWaffleGameModeData extends BaseData {
  level?: ProbableWaffleLevelEnum;
}

export class ProbableWaffleGameMode extends BaseGameMode<ProbableWaffleGameModeData> {
  constructor(data?: ProbableWaffleGameModeData) {
    super(data as ProbableWaffleGameModeData);
  }
}
