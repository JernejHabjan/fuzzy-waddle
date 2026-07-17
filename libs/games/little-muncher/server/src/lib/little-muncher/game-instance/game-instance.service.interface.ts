import { type GameInstanceDataDto, GameInstanceId, type RoomAction, type SpectatorAction } from "@fuzzy-waddle/platform-game-sessions";
import { type LittleMuncherGameCreateDto, LittleMuncherGameInstance, type LittleMuncherGameInstanceData, type LittleMuncherRoom, type LittleMuncherRoomEvent, type LittleMuncherSpectatorEvent } from "@fuzzy-waddle/little-muncher-protocol";
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
    gameInstanceId: GameInstanceId,
    action: SpectatorAction
  ): LittleMuncherSpectatorEvent;
  findGameInstance(gameInstanceId: GameInstanceId): LittleMuncherGameInstance | undefined;
}
