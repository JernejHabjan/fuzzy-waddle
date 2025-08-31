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
import { type User } from "../../../users/users.service";
import { type GameInstanceServiceInterface } from "./game-instance.service.interface";

export const GameInstanceServiceStub = {
  findGameInstance(gameInstanceId: string): LittleMuncherGameInstance | undefined {
    return undefined;
  },
  startGame(body: GameInstanceDataDto, user: User): Promise<void> {
    return Promise.resolve();
  },
  stopGame(body: GameInstanceDataDto, user: User): Promise<void> {
    return Promise.resolve();
  },
  getGameInstanceToRoom(gameInstance: LittleMuncherGameInstance): LittleMuncherRoom {
    return {} as LittleMuncherRoom;
  },
  getRoomEvent(gameInstance: LittleMuncherGameInstance, action: RoomAction): LittleMuncherRoomEvent {
    return {} as LittleMuncherRoomEvent;
  },
  getSpectatorEvent(user: User, room: LittleMuncherRoom, action: SpectatorAction): LittleMuncherSpectatorEvent {
    return {} as LittleMuncherSpectatorEvent;
  },
  getSpectatorRooms(user: User): Promise<LittleMuncherRoom[]> {
    return Promise.resolve([]);
  },
  spectatorJoined(body: GameInstanceDataDto, user: User): Promise<LittleMuncherGameInstanceData> {
    return Promise.resolve({} as LittleMuncherGameInstanceData);
  },
  spectatorLeft(body: GameInstanceDataDto, user: User): Promise<void> {
    return Promise.resolve();
  },
  startLevel(body: LittleMuncherGameCreateDto, user: User): Promise<void> {
    return Promise.resolve();
  },
  stopLevel(body: GameInstanceDataDto, user: User): Promise<void> {
    return Promise.resolve();
  }
} satisfies GameInstanceServiceInterface;
