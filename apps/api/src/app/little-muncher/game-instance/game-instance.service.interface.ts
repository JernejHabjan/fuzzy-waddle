import {
  type GameInstanceDataDto,
  type LittleMuncherGameCreateDto,
  LittleMuncherGameInstance,
  type LittleMuncherGameInstanceData,
  type LittleMuncherRoom,
  type LittleMuncherRoomEvent,
  type LittleMuncherSpectatorEvent,
  type RoomAction,
  type SpectatorAction
} from "@fuzzy-waddle/api-interfaces";
import { type User } from "@supabase/supabase-js";

export interface GameInstanceServiceInterface {
  startGame(body: GameInstanceDataDto, user: User): Promise<void>;
  stopGame(body: GameInstanceDataDto, user: User): Promise<void>;
  startLevel(body: LittleMuncherGameCreateDto, user: User): Promise<void>;
  spectatorJoined(body: GameInstanceDataDto, user: User): Promise<LittleMuncherGameInstanceData>;
  spectatorLeft(body: GameInstanceDataDto, user: User): Promise<void>;
  stopLevel(body: GameInstanceDataDto, user: User): Promise<void>;

  getSpectatorRooms(user: User): Promise<LittleMuncherRoom[]>;

  getGameInstanceToRoom(gameInstance: LittleMuncherGameInstance): LittleMuncherRoom;

  getRoomEvent(gameInstance: LittleMuncherGameInstance, action: RoomAction): LittleMuncherRoomEvent;

  getSpectatorEvent(
    user: User,
    room: LittleMuncherRoom,
    gameInstanceId: string,
    action: SpectatorAction
  ): LittleMuncherSpectatorEvent;
  findGameInstance(gameInstanceId: string): LittleMuncherGameInstance | undefined;
}
