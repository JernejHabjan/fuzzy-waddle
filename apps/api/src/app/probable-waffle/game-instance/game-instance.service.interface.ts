import {
  GameInstanceDataDto,
  ProbableWaffleGameCreateDto,
  ProbableWaffleGameInstance,
  ProbableWaffleGameInstanceData,
  Room,
  RoomAction,
  RoomEvent,
  SpectatorAction,
  SpectatorEvent
} from "@fuzzy-waddle/api-interfaces";
import { User } from "@supabase/supabase-js";

export interface GameInstanceServiceInterface {
  startGame(body: GameInstanceDataDto, user: User);

  stopGame(body: GameInstanceDataDto, user: User);

  startLevel(body: ProbableWaffleGameCreateDto, user: User);

  spectatorJoined(body: GameInstanceDataDto, user: User): Promise<ProbableWaffleGameInstanceData>;

  spectatorLeft(body: GameInstanceDataDto, user: User);

  stopLevel(body: GameInstanceDataDto, user: User);

  getSpectatorRooms(user: User): Promise<Room[]>;

  getGameInstanceToRoom(gameInstance: ProbableWaffleGameInstance): Room;

  getRoomEvent(gameInstance: ProbableWaffleGameInstance, action: RoomAction): RoomEvent;

  getSpectatorEvent(user: User, room: Room, action: SpectatorAction): SpectatorEvent;

  findGameInstance(gameInstanceId: string): ProbableWaffleGameInstance | undefined;
}
