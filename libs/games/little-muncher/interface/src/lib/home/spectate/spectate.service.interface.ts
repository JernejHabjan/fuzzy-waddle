import { type GameInstanceId } from "@fuzzy-waddle/platform-game-sessions";
import { type LittleMuncherRoom, type LittleMuncherRoomEvent } from "@fuzzy-waddle/little-muncher-protocol";
import { Observable, Subject } from "rxjs";

export interface SpectateServiceInterface {
  rooms: LittleMuncherRoom[];
  spectatorDisconnected: Subject<void>;

  listenToRoomEvents(): Promise<void>;

  getRooms(): Promise<LittleMuncherRoom[]>;

  initiallyPullRooms(): Promise<void>;

  getRoomEvent(): Promise<Observable<LittleMuncherRoomEvent> | undefined>;

  joinRoom(gameInstanceId: GameInstanceId): void;

  leaveRoom(gameInstanceId: GameInstanceId): void;

  destroy(): void;
}
