import { ProbableWaffleGameModeData } from "../game-instance/probable-waffle/game-mode";
import {
  FactionType,
  ProbableWafflePlayerControllerData,
  ProbableWafflePlayerStateData
} from "../game-instance/probable-waffle/player";
import { ProbableWaffleMapEnum } from "./probable-waffle";
import { ProbableWaffleSpectatorData } from "../game-instance/probable-waffle/spectator";
import { GameInstanceDataDto } from "../game-instance/game-instance";
import {
  ProbableWaffleGameInstance,
  ProbableWaffleGameInstanceData
} from "../game-instance/probable-waffle/game-instance";

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

export interface RequestGameSearchForMatchMakingDto {
  mapPoolIds: number[];
  factionType: FactionType | null;
}

export enum ProbableWaffleGatewayRoomTypes {
  ProbableWaffleGameInstance = "probable_waffle_gi_"
}

export interface PendingMatchmakingGameInstance {
  gameInstance: ProbableWaffleGameInstance;
  commonMapPoolIds: number[];
}

export interface ProbableWaffleGameInstanceSaveData {
  saveName: string;
  gameInstanceData: ProbableWaffleGameInstanceData;
}
