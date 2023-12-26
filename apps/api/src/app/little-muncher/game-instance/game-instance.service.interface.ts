import {
  GameInstanceDataDto,
  LittleMuncherGameCreateDto,
  LittleMuncherGameInstance,
  LittleMuncherGameInstanceData,
  LittleMuncherRoom,
  LittleMuncherRoomEvent,
  LittleMuncherSpectatorEvent,
  RoomAction,
  SpectatorAction
} from "@fuzzy-waddle/api-interfaces";
import { User } from "@supabase/supabase-js";

export interface GameInstanceServiceInterface {
  startGame(body: GameInstanceDataDto, user: User);
  stopGame(body: GameInstanceDataDto, user: User);
  startLevel(body: LittleMuncherGameCreateDto, user: User);
  spectatorJoined(body: GameInstanceDataDto, user: User): Promise<LittleMuncherGameInstanceData>;
  spectatorLeft(body: GameInstanceDataDto, user: User);
  stopLevel(body: GameInstanceDataDto, user: User);

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
