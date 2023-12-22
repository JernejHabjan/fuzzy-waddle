import { ProbableWaffleGameModeData } from "../game-instance/probable-waffle/game-mode";
import { PositionPlayerDefinition } from "../game-instance/probable-waffle/player";
import { ProbableWaffleMapEnum } from "./probable-waffle";

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

export interface ProbableWaffleGetRoomsDto {
  maps: ProbableWaffleMapEnum[] | null;
}

export interface ProbableWafflePlayerLeftDto {
  gameInstanceId: string;
  playerNumber: number;
}
