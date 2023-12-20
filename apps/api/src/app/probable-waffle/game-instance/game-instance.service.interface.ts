import {
  GameInstanceDataDto,
  ProbableWaffleGameCreateDto,
  ProbableWaffleGameInstance,
  ProbableWaffleGameInstanceData,
  ProbableWaffleRoom,
  RoomAction,
  ProbableWaffleRoomEvent,
  SpectatorAction,
  ProbableWaffleSpectatorEvent
} from "@fuzzy-waddle/api-interfaces";
import { User } from "@supabase/supabase-js";

export interface GameInstanceServiceInterface {
  startGame(body: GameInstanceDataDto, user: User);

  stopGame(body: GameInstanceDataDto, user: User);

  startLevel(body: ProbableWaffleGameCreateDto, user: User);

  spectatorJoined(body: GameInstanceDataDto, user: User): Promise<ProbableWaffleGameInstanceData>;

  spectatorLeft(body: GameInstanceDataDto, user: User);

  stopLevel(body: GameInstanceDataDto, user: User);

  getSpectatorRooms(user: User): Promise<ProbableWaffleRoom[]>;

  getGameInstanceToRoom(gameInstance: ProbableWaffleGameInstance): ProbableWaffleRoom;

  getRoomEvent(gameInstance: ProbableWaffleGameInstance, action: RoomAction): ProbableWaffleRoomEvent;

  getSpectatorEvent(user: User, room: ProbableWaffleRoom, action: SpectatorAction): ProbableWaffleSpectatorEvent;

  findGameInstance(gameInstanceId: string): ProbableWaffleGameInstance | undefined;
}
