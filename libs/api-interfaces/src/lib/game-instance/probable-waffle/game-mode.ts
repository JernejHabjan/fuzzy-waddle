import { BaseData } from "../data";
import { BaseGameMode } from "../game-mode";
import { ProbableWaffleMapEnum } from "../../probable-waffle/probable-waffle";
import { DifficultyModifiers, MapTuning, WinConditions } from "../../probable-waffle/probable-waffle-game-mode-lobby";

export interface ProbableWaffleGameModeData extends BaseData {
  map?: ProbableWaffleMapEnum;
  winConditions: WinConditions;
  mapTuning: MapTuning;
  difficultyModifiers: DifficultyModifiers;
  maxPlayers?: number;
}

export class ProbableWaffleGameMode extends BaseGameMode<ProbableWaffleGameModeData> {
  constructor(data?: ProbableWaffleGameModeData) {
    super(data as ProbableWaffleGameModeData);
  }
}
