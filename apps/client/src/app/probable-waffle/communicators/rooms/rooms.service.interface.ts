import { Observable } from "rxjs";
import { ProbableWaffleRoom, ProbableWaffleRoomEvent } from "@fuzzy-waddle/api-interfaces";

export interface RoomsServiceInterface {
  rooms: ProbableWaffleRoom[];

  listenToRoomEvents(): void;

  getRooms(): Promise<ProbableWaffleRoom[]>;

  initiallyPullRooms(): Promise<void>;

  get roomEvent(): Observable<ProbableWaffleRoomEvent> | undefined;

  joinRoom(gameInstanceId: string): void;

  joinRoomSpectator(gameInstanceId: string): void;

  leaveRoom(gameInstanceId: string): void;

  destroy(): void;
}
