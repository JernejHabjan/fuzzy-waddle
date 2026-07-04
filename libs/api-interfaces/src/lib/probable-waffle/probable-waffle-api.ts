import type { ProbableWaffleGameModeData } from "../game-instance/probable-waffle/game-mode";
import type {
  FactionType,
  ProbableWafflePlayerControllerData,
  ProbableWafflePlayerStateData
} from "../game-instance/probable-waffle/player";
import { ProbableWaffleMapEnum } from "./probable-waffle";
import type { ProbableWaffleSpectatorData } from "../game-instance/probable-waffle/spectator";
import type { GameInstanceDataDto } from "../game-instance/game-instance";
import type {
  ProbableWaffleGameInstance,
  ProbableWaffleGameInstanceData
} from "../game-instance/probable-waffle/game-instance";
import type { GameInstanceId, PlayerNumber } from "../game-instance/player/player";

export interface ProbableWaffleStartLevelDto extends GameInstanceDataDto {
  gameInstanceId: GameInstanceId;
}

export interface ProbableWaffleChangeGameModeDto extends GameInstanceDataDto {
  gameInstanceId: GameInstanceId;
  gameModeData: ProbableWaffleGameModeData;
}

export interface ProbableWaffleAddPlayerDto extends GameInstanceDataDto {
  gameInstanceId: GameInstanceId;
  player: {
    stateData: ProbableWafflePlayerStateData;
    controllerData: ProbableWafflePlayerControllerData;
  };
}

export interface ProbableWaffleAddSpectatorDto extends GameInstanceDataDto {
  gameInstanceId: GameInstanceId;
  spectator: {
    data: ProbableWaffleSpectatorData;
  };
}

export interface ProbableWaffleGetRoomsDto {
  maps: ProbableWaffleMapEnum[] | null;
}

export interface ProbableWafflePlayerLeftDto extends GameInstanceDataDto {
  gameInstanceId: GameInstanceId;
  playerNumber: PlayerNumber;
}

export interface RequestGameSearchForMatchMakingDto {
  mapPoolIds: number[];
  factionType: FactionType | null;
  teamConfiguration?: MatchmakingTeamConfiguration;
}

export enum MatchmakingTeamConfiguration {
  FreeForAll = "FFA", // Each player on their own team
  TwoVsTwo = "2v2", // 2 teams of 2 players
  ThreeVsThree = "3v3", // 2 teams of 3 players
  FourVsFour = "4v4" // 2 teams of 4 players
}

export enum ProbableWaffleGatewayRoomTypes {
  ProbableWaffleGameInstance = "probable_waffle_gi_"
}

export interface PendingMatchmakingGameInstance {
  gameInstance: ProbableWaffleGameInstance;
  commonMapPoolIds: number[];
  teamConfiguration: MatchmakingTeamConfiguration;
}

export interface ProbableWaffleGameInstanceSaveData {
  saveName: string;
  created: Date;
  gameInstanceData: ProbableWaffleGameInstanceData;
  thumbnail: string;
}
