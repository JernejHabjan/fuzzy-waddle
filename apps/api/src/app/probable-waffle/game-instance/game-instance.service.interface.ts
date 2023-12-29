import {
  GameInstanceDataDto,
  PlayerAction,
  ProbableWaffleGameInstance,
  ProbableWaffleGameInstanceData,
  ProbableWaffleGameInstanceMetadataData,
  ProbableWaffleGetRoomsDto,
  ProbableWafflePlayer,
  ProbableWafflePlayerEvent,
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

  stopLevel(body: GameInstanceDataDto, user: User);

  getJoinableRooms(user: User, body: ProbableWaffleGetRoomsDto): Promise<ProbableWaffleRoom[]>;

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
}
