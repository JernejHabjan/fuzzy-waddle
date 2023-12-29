import { ProbableWaffleGameModeData } from "../game-instance/probable-waffle/game-mode";
import {
  ProbableWafflePlayerControllerData,
  ProbableWafflePlayerStateData
} from "../game-instance/probable-waffle/player";
import { ProbableWaffleMapEnum } from "./probable-waffle";
import { ProbableWaffleSpectatorData } from "../game-instance/probable-waffle/spectator";
import { GameInstanceDataDto } from "../game-instance/game-instance";

export interface ProbableWaffleStartLevelDto extends GameInstanceDataDto {
  gameInstanceId: string;
}

export interface ProbableWaffleChangeGameModeDto extends GameInstanceDataDto {
  gameInstanceId: string;
  gameModeData: ProbableWaffleGameModeData;
}

export interface ProbableWaffleAddPlayerDto extends GameInstanceDataDto {
  gameInstanceId: string;
  player: {
    userId: string | null;
    stateData: ProbableWafflePlayerStateData;
    controllerData: ProbableWafflePlayerControllerData;
  };
}

export interface ProbableWaffleAddSpectatorDto extends GameInstanceDataDto {
  gameInstanceId: string;
  spectator: {
    data: ProbableWaffleSpectatorData;
  };
}

export interface ProbableWaffleGetRoomsDto {
  maps: ProbableWaffleMapEnum[] | null;
}

export interface ProbableWafflePlayerLeftDto extends GameInstanceDataDto {
  gameInstanceId: string;
  playerNumber: number;
}
