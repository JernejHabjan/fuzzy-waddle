import { Observable } from "rxjs";
import { ProbableWaffleMapEnum, ProbableWaffleRoom, ProbableWaffleRoomEvent } from "@fuzzy-waddle/api-interfaces";
import { computed, Signal, WritableSignal } from "@angular/core";

export interface RoomsServiceInterface {
  rooms: WritableSignal<ProbableWaffleRoom[]>;
  playersSearchingForMatchmakingGame: Signal<number>;
  matchmakingGamesInProgress: Signal<number>;
  init(): Promise<void>;
  listenToRoomEvents(): void;

  getRooms(maps: ProbableWaffleMapEnum[] | null): Promise<ProbableWaffleRoom[]>;

  initiallyPullRooms(): Promise<void>;

  get roomEvent(): Observable<ProbableWaffleRoomEvent> | undefined;

  destroy(): void;
}
