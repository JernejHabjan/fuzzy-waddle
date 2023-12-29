import { Observable } from "rxjs";
import { ProbableWaffleMapEnum, ProbableWaffleRoom, ProbableWaffleRoomEvent } from "@fuzzy-waddle/api-interfaces";

export interface RoomsServiceInterface {
  rooms: ProbableWaffleRoom[];

  init(): Promise<void>;
  listenToRoomEvents(): void;

  getRooms(maps: ProbableWaffleMapEnum[] | null): Promise<ProbableWaffleRoom[]>;

  initiallyPullRooms(): Promise<void>;

  get roomEvent(): Observable<ProbableWaffleRoomEvent> | undefined;

  joinRoom(gameInstanceId: string): void;

  joinRoomSpectator(gameInstanceId: string): void;

  leaveRoom(gameInstanceId: string): void;

  destroy(): void;
}
