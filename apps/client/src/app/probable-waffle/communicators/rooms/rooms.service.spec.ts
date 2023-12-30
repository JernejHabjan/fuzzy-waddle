import { TestBed } from "@angular/core/testing";

import { RoomsService } from "./rooms.service";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { RoomsServiceInterface } from "./rooms.service.interface";
import { Observable } from "rxjs";
import { AuthService } from "../../../auth/auth.service";
import { authServiceStub } from "../../../auth/auth.service.spec";
import { ProbableWaffleRoom, ProbableWaffleRoomEvent } from "@fuzzy-waddle/api-interfaces";

export const roomsServiceStub = {
  rooms: [],
  init(): Promise<void> {
    return Promise.resolve();
  },
  listenToRoomEvents() {
    //
  },
  destroy() {
    //
  },
  get roomEvent(): Observable<ProbableWaffleRoomEvent> | undefined {
    return undefined;
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
      imports: [HttpClientTestingModule],
      providers: [{ provide: AuthService, useValue: authServiceStub }]
    });
    service = TestBed.inject(RoomsService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
