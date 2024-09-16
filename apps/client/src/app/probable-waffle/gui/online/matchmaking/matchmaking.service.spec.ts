import { TestBed } from "@angular/core/testing";

import { MatchmakingService } from "./matchmaking.service";
import { RoomsService } from "../../../communicators/rooms/rooms.service";
import { roomsServiceStub } from "../../../communicators/rooms/rooms.service.spec";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "../../../communicators/game-instance-client.service.spec";
import { IMatchmakingService } from "./matchmaking.service.interface";
import { FactionType } from "@fuzzy-waddle/api-interfaces";
import { MatchmakingLevel } from "./matchmaking.component";

export const matchmakingServiceStub = {
  searching: false,
  matchmakingOptions: {
    factionType: FactionType.Skaduwee,
    nrOfPlayers: 0,
    levels: []
  },
  gameFound: false,
  cancelSearching(): Promise<void> {
    return Promise.resolve();
  },
  checkedChanged(level: MatchmakingLevel) {
    //
  },
  nrOfPlayersChanged(nr: number) {},
  startSearching(): Promise<void> {
    return Promise.resolve();
  },
  navigatingText: "",
  init(): Promise<void> {
    return Promise.resolve();
  },
  destroy(): Promise<void> {
    return Promise.resolve();
  },
  factionChanged() {
    //
  }
} satisfies IMatchmakingService;

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
