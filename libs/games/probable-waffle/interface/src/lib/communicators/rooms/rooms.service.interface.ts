import { ProbableWaffleMapEnum, type ProbableWaffleRoom } from "@fuzzy-waddle/api-interfaces";
import { type Signal, type WritableSignal } from "@angular/core";

export interface RoomsServiceInterface {
  rooms: WritableSignal<ProbableWaffleRoom[]>;
  playersSearchingForMatchmakingGame: Signal<number>;
  matchmakingGamesInProgress: Signal<number>;
  init(): Promise<void>;
  listenToRoomEvents(): Promise<void>;

  getRooms(maps: ProbableWaffleMapEnum[] | null): Promise<ProbableWaffleRoom[]>;

  initiallyPullRooms(): Promise<void>;
  destroy(): void;
}
