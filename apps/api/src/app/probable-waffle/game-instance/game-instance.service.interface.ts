import {
  GameInstanceDataDto,
  PlayerAction,
  PlayerLobbyDefinition,
  ProbableWaffleAddPlayerDto,
  ProbableWaffleAddSpectatorDto,
  ProbableWaffleChangeGameModeDto,
  ProbableWaffleGameInstance,
  ProbableWaffleGameInstanceData,
  ProbableWaffleGameInstanceMetadataData,
  ProbableWaffleGetRoomsDto,
  ProbableWafflePlayer,
  ProbableWafflePlayerEvent,
  ProbableWafflePlayerLeftDto,
  ProbableWaffleRoom,
  ProbableWaffleRoomEvent,
  ProbableWaffleSpectator,
  ProbableWaffleSpectatorEvent,
  ProbableWaffleStartLevelDto,
  RoomAction,
  SpectatorAction
} from "@fuzzy-waddle/api-interfaces";
import { User } from "@supabase/supabase-js";

export interface GameInstanceServiceInterface {
  addGameInstance(gameInstance: ProbableWaffleGameInstance): void;
  getPlayerLobbyDefinitionForNewPlayer(gameInstance: ProbableWaffleGameInstance): PlayerLobbyDefinition;
  getPlayerColorForNewPlayer(gameInstance: ProbableWaffleGameInstance): string;
  createGameInstance(gameInstanceMetadataData: ProbableWaffleGameInstanceMetadataData, user: User);
  stopGameInstance(body: GameInstanceDataDto, user: User);
  startLevel(body: ProbableWaffleStartLevelDto, user: User);
  joinRoom(
    body: GameInstanceDataDto,
    user: User,
    options: {
      playerNumber: number;
      playerName: string;
      playerPosition: number;
    }
  ): Promise<ProbableWaffleGameInstanceData>;
  leaveRoom(body: GameInstanceDataDto, user: User);
  getVisibleRooms(user: User, body: ProbableWaffleGetRoomsDto): Promise<ProbableWaffleRoom[]>;
  getGameInstanceToRoom(gameInstance: ProbableWaffleGameInstance): ProbableWaffleRoom;
  getRoomEvent(gameInstance: ProbableWaffleGameInstance, action: RoomAction): ProbableWaffleRoomEvent;
  getPlayerEvent(
    player: ProbableWafflePlayer,
    gameInstanceId: string,
    action: PlayerAction,
    user: User
  ): ProbableWafflePlayerEvent;
  getSpectatorEvent(
    spectator: ProbableWaffleSpectator,
    gameInstanceId: string,
    action: SpectatorAction,
    user: User
  ): ProbableWaffleSpectatorEvent;
  findGameInstance(gameInstanceId: string): ProbableWaffleGameInstance | undefined;
  changeGameMode(user: User, body: ProbableWaffleChangeGameModeDto): Promise<void>;
  openPlayerSlot(body: ProbableWaffleAddPlayerDto, user: User): Promise<void>;
  playerLeft(body: ProbableWafflePlayerLeftDto, user: User): Promise<void>;
  addPlayer(body: ProbableWaffleAddPlayerDto, user: User): Promise<void>;
  addSpectator(body: ProbableWaffleAddSpectatorDto, user: User): Promise<void>;
  getGameInstance(gameInstanceId: string, user: User): Promise<ProbableWaffleGameInstanceData | null>;
}
