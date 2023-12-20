import { TestBed } from "@angular/core/testing";

import { RoomsService } from "./rooms.service";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { RoomsServiceInterface } from "./rooms.service.interface";
import { RoomEvent } from "@fuzzy-waddle/api-interfaces";
import { Observable } from "rxjs";
import { AuthService } from "../../../auth/auth.service";
import { authServiceStub } from "../../../auth/auth.service.spec";

export const spectateServiceStub = {
  rooms: [],
  listenToRoomEvents() {
    //
  },
  destroy() {
    //
  },
  get roomEvent(): Observable<RoomEvent> | undefined {
    return undefined;
  },
  getRooms() {
    return Promise.resolve([]);
  },
  initiallyPullRooms(): Promise<void> {
    return Promise.resolve();
  },
  joinRoom() {
    //
  },
  joinRoomSpectator() {
    //
  },
  leaveRoom() {
    //
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
