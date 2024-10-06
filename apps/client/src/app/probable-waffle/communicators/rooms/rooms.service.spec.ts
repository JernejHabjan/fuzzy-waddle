import { TestBed } from "@angular/core/testing";
import { RoomsService } from "./rooms.service";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { RoomsServiceInterface } from "./rooms.service.interface";
import { AuthService } from "../../../auth/auth.service";
import { authServiceStub } from "../../../auth/auth.service.spec";
import { ProbableWaffleRoom } from "@fuzzy-waddle/api-interfaces";
import { computed, signal } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";

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
describe("RoomsService", () => {
  let service: RoomsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: AuthService, useValue: authServiceStub }]
    });
    service = TestBed.inject(RoomsService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
