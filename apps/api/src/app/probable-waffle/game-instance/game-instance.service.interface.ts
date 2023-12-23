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
  ProbableWafflePlayer
} from "@fuzzy-waddle/api-interfaces";
import { User } from "@supabase/supabase-js";

export interface GameInstanceServiceInterface {
  startGame(body: GameInstanceDataDto, user: User);

  stopGame(body: GameInstanceDataDto, user: User);

  startLevel(body: ProbableWaffleStartLevelDto, user: User);

  joinRoom(body: GameInstanceDataDto, user: User): Promise<ProbableWaffleGameInstanceData>;

  leaveRoom(body: GameInstanceDataDto, user: User);

  stopLevel(body: GameInstanceDataDto, user: User);

  getJoinableRooms(user: User): Promise<ProbableWaffleRoom[]>;

  getGameInstanceToRoom(gameInstance: ProbableWaffleGameInstance): ProbableWaffleRoom;

  getRoomEvent(gameInstance: ProbableWaffleGameInstance, action: RoomAction): ProbableWaffleRoomEvent;

  getPlayerEvent(
    user: User,
    player: ProbableWafflePlayer,
    gameInstanceId: string,
    action: PlayerAction
  ): ProbableWaffleSpectatorEvent;

  getSpectatorEvent(user: User, gameInstanceId: string, action: SpectatorAction): ProbableWaffleSpectatorEvent;

  findGameInstance(gameInstanceId: string): ProbableWaffleGameInstance | undefined;
}
