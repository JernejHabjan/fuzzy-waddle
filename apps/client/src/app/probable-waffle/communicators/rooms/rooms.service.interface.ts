import { Room, RoomEvent } from "@fuzzy-waddle/api-interfaces";
import { Observable } from "rxjs";

export interface RoomsServiceInterface {
  rooms: Room[];

  listenToRoomEvents(): void;

  getRooms(): Promise<Room[]>;

  initiallyPullRooms(): Promise<void>;

  get roomEvent(): Observable<RoomEvent> | undefined;

  joinRoom(gameInstanceId: string): void;

  joinRoomSpectator(gameInstanceId: string): void;

  leaveRoom(gameInstanceId: string): void;

  destroy(): void;
}
