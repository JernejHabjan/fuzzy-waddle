import { TestBed } from "@angular/core/testing";

import { MatchmakingService } from "./matchmaking.service";
import { RoomsService } from "../../../communicators/rooms/rooms.service";
import { roomsServiceStub } from "../../../communicators/rooms/rooms.service.stub";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "../../../communicators/game-instance-client.service.stub";

describe("MatchmakingService", () => {
  let service: MatchmakingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: RoomsService,
          useValue: roomsServiceStub
        },
        {
          provide: GameInstanceClientService,
          useValue: gameInstanceClientServiceStub
        }
      ]
    });
    service = TestBed.inject(MatchmakingService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
