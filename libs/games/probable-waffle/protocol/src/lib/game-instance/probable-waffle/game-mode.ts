import type { BaseData } from "@fuzzy-waddle/platform-game-sessions";
import { BaseGameMode } from "@fuzzy-waddle/platform-game-sessions";
import { ProbableWaffleMapEnum } from "../../probable-waffle/probable-waffle";
import type {
  DifficultyModifiers,
  MapTuning,
  TieConditions,
  LoseConditions,
  WinConditions
} from "../../probable-waffle/probable-waffle-game-mode-lobby";

export interface ProbableWaffleGameModeData extends BaseData {
  map?: ProbableWaffleMapEnum;
  mapTuning: MapTuning;
  difficultyModifiers: DifficultyModifiers;
  tieConditions: TieConditions;
  winConditions: WinConditions;
  loseConditions: LoseConditions;
}

export class ProbableWaffleGameMode extends BaseGameMode<ProbableWaffleGameModeData> {
  constructor(data?: ProbableWaffleGameModeData) {
    super(data as ProbableWaffleGameModeData);
  }
}
