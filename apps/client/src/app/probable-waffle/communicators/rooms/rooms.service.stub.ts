import { RoomsServiceInterface } from "./rooms.service.interface";
import { ProbableWaffleRoom } from "@fuzzy-waddle/api-interfaces";
import { computed, signal } from "@angular/core";

export const roomsServiceStub = {
  rooms: signal<ProbableWaffleRoom[]>([]),
  playersSearchingForMatchmakingGame: computed(() => 0),
  matchmakingGamesInProgress: computed(() => 0),
  init(): Promise<void> {
    return Promise.resolve();
  },
  listenToRoomEvents(): Promise<void> {
    //
    return Promise.resolve();
  },
  destroy() {
    //
  },
  getRooms(): Promise<ProbableWaffleRoom[]> {
    return Promise.resolve([]);
  },
  initiallyPullRooms(): Promise<void> {
    return Promise.resolve();
  }
} satisfies RoomsServiceInterface;
