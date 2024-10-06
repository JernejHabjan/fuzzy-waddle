import { LittleMuncherRoom, LittleMuncherRoomEvent } from "@fuzzy-waddle/api-interfaces";
import { Observable, Subject } from "rxjs";

export interface SpectateServiceInterface {
  rooms: LittleMuncherRoom[];
  spectatorDisconnected: Subject<void>;

  listenToRoomEvents(): Promise<void>;

  getRooms(): Promise<LittleMuncherRoom[]>;

  initiallyPullRooms(): Promise<void>;

  getRoomEvent(): Promise<Observable<LittleMuncherRoomEvent> | undefined>;

  joinRoom(gameInstanceId: string): void;

  leaveRoom(gameInstanceId: string): void;

  destroy(): void;
}
