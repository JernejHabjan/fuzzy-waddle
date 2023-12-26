import {
  GameInstanceDataDto,
  ProbableWaffleStartLevelDto,
  ProbableWaffleGameInstance,
  ProbableWaffleGameInstanceData,
  ProbableWaffleRoom,
  RoomAction,
  ProbableWaffleRoomEvent,
  SpectatorAction,
  ProbableWaffleSpectatorEvent,
  PlayerAction,
  ProbableWafflePlayer,
  ProbableWaffleGetRoomsDto,
  ProbableWafflePlayerEvent,
  ProbableWaffleSpectator
} from "@fuzzy-waddle/api-interfaces";
import { User } from "@supabase/supabase-js";

export interface GameInstanceServiceInterface {
  createGameInstance(body: GameInstanceDataDto, user: User);

  stopGameInstance(body: GameInstanceDataDto, user: User);

  startLevel(body: ProbableWaffleStartLevelDto, user: User);

  joinRoom(body: GameInstanceDataDto, user: User): Promise<ProbableWaffleGameInstanceData>;

  leaveRoom(body: GameInstanceDataDto, user: User);

  stopLevel(body: GameInstanceDataDto, user: User);

  getJoinableRooms(user: User, body: ProbableWaffleGetRoomsDto): Promise<ProbableWaffleRoom[]>;

  getGameInstanceToRoom(gameInstance: ProbableWaffleGameInstance): ProbableWaffleRoom;

  getRoomEvent(gameInstance: ProbableWaffleGameInstance, action: RoomAction): ProbableWaffleRoomEvent;

  getPlayerEvent(
    user: User,
    player: ProbableWafflePlayer,
    gameInstanceId: string,
    action: PlayerAction
  ): ProbableWafflePlayerEvent;

  getSpectatorEvent(
    user: User,
    spectator: ProbableWaffleSpectator,
    gameInstanceId: string,
    action: SpectatorAction
  ): ProbableWaffleSpectatorEvent;

  findGameInstance(gameInstanceId: string): ProbableWaffleGameInstance | undefined;
}
