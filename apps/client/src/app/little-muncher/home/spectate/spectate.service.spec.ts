import { TestBed } from "@angular/core/testing";

import { SpectateService } from "./spectate.service";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { SpectateServiceInterface } from "./spectate.service.interface";
import { Observable, Subject } from "rxjs";
import { AuthService } from "../../../auth/auth.service";
import { authServiceStub } from "../../../auth/auth.service.spec";
import { LittleMuncherRoomEvent } from "@fuzzy-waddle/api-interfaces";

export const spectateServiceStub = {
  rooms: [],
  spectatorDisconnected: new Subject<void>(),
  listenToRoomEvents() {
    //
  },
  destroy() {
    //
  },
  get roomEvent(): Observable<LittleMuncherRoomEvent> | undefined {
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
  leaveRoom() {
    //
  }
} satisfies SpectateServiceInterface;
describe("SpectateService", () => {
  let service: SpectateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: AuthService, useValue: authServiceStub }]
    });
    service = TestBed.inject(SpectateService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
