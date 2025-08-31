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
  startGame(body: GameInstanceDataDto, user: User) {
    //
  },
  stopGame(body: GameInstanceDataDto, user: User) {
    //
  },
  getGameInstanceToRoom(gameInstance: LittleMuncherGameInstance): LittleMuncherRoom {
    return undefined;
  },
  getRoomEvent(gameInstance: LittleMuncherGameInstance, action: RoomAction): LittleMuncherRoomEvent {
    return undefined;
  },
  getSpectatorEvent(user: User, room: LittleMuncherRoom, action: SpectatorAction): LittleMuncherSpectatorEvent {
    return undefined;
  },
  getSpectatorRooms(user: User): Promise<LittleMuncherRoom[]> {
    return undefined;
  },
  spectatorJoined(body: GameInstanceDataDto, user: User): Promise<LittleMuncherGameInstanceData> {
    return undefined;
  },
  spectatorLeft(body: GameInstanceDataDto, user: User) {
    //
  },
  startLevel(body: LittleMuncherGameCreateDto, user: User) {
    //
  },
  stopLevel(body: GameInstanceDataDto, user: User) {
    //
  }
} satisfies GameInstanceServiceInterface;
