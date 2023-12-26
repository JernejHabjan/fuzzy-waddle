import { ProbableWaffleGameModeData } from "../game-instance/probable-waffle/game-mode";
import { PositionPlayerDefinition, ProbableWafflePlayer } from "../game-instance/probable-waffle/player";
import { ProbableWaffleMapEnum } from "./probable-waffle";
import { ProbableWaffleSpectator } from "../game-instance/probable-waffle/spectator";

export interface ProbableWaffleStartLevelDto {
  gameInstanceId: string;
}

export interface ProbableWaffleChangeGameModeDto {
  gameInstanceId: string;
  gameModeData: ProbableWaffleGameModeData;
}

export interface ProbableWaffleAddPlayerDto {
  gameInstanceId: string;
  player: ProbableWafflePlayer;
}

export interface ProbableWaffleAddSpectatorDto {
  gameInstanceId: string;
  spectator: ProbableWaffleSpectator;
}

export interface ProbableWaffleGetRoomsDto {
  maps: ProbableWaffleMapEnum[] | null;
}

export interface ProbableWafflePlayerLeftDto {
  gameInstanceId: string;
  playerNumber: number;
}
