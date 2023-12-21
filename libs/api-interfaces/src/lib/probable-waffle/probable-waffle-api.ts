import { ProbableWaffleGameModeData } from "../game-instance/probable-waffle/game-mode";
import { PositionPlayerDefinition } from "../game-instance/probable-waffle/player";

export interface ProbableWaffleStartLevelDto {
  gameInstanceId: string;
}

export interface ProbableWaffleChangeGameModeDto {
  gameInstanceId: string;
  gameModeData: ProbableWaffleGameModeData;
}

export interface ProbableWaffleAddPlayerDto {
  gameInstanceId: string;
  playerDefinition: PositionPlayerDefinition;
}
