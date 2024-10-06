import { ProbableWaffleMapEnum, ProbableWaffleRoom } from "@fuzzy-waddle/api-interfaces";
import { Signal, WritableSignal } from "@angular/core";

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
