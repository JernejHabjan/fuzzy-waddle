import {
  GameInstanceDataDto,
  LittleMuncherGameCreateDto,
  LittleMuncherGameInstance,
  LittleMuncherGameInstanceData,
  Room,
  RoomAction,
  RoomEvent,
  SpectatorAction,
  SpectatorEvent
} from '@fuzzy-waddle/api-interfaces';
import { User } from '@supabase/supabase-js';

export interface GameInstanceServiceInterface {
  startGame(body: GameInstanceDataDto, user: User);
  stopGame(body: GameInstanceDataDto, user: User);
  startLevel(body: LittleMuncherGameCreateDto, user: User);
  spectatorJoined(body: GameInstanceDataDto, user: User): Promise<LittleMuncherGameInstanceData>;
  spectatorLeft(body: GameInstanceDataDto, user: User);
  stopLevel(body: GameInstanceDataDto, user: User);
  getSpectatorRooms(user: User): Promise<Room[]>;
  getGameInstanceToRoom(gameInstance: LittleMuncherGameInstance): Room;
  getRoomEvent(gameInstance: LittleMuncherGameInstance, action: RoomAction): RoomEvent;
  getSpectatorEvent(user: User, room: Room, action: SpectatorAction): SpectatorEvent;
  findGameInstance(gameInstanceId: string): LittleMuncherGameInstance | undefined;
}
