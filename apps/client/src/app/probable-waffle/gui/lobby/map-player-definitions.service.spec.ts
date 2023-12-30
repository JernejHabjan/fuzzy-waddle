import { TestBed } from "@angular/core/testing";

import { MapPlayerDefinitionsService } from "./map-player-definitions.service";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "../../communicators/game-instance-client.service.spec";
import { MapPlayerDefinitionsServiceInterface } from "./map-player-definitions.service.interface";
import { PositionPlayerDefinition } from "@fuzzy-waddle/api-interfaces";
import { Subject } from "rxjs";

export const mapPlayerDefinitionsServiceStub = {
  init: () => {},
  mapPlayerDefinitions: [],
  selectedMap: null,
  playerRemoved: new Subject<PositionPlayerDefinition>(),
  gameModeOrMapChanged: new Subject()
} satisfies MapPlayerDefinitionsServiceInterface;

describe("MapPlayerDefinitionsService", () => {
  let service: MapPlayerDefinitionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub }]
    });
    service = TestBed.inject(MapPlayerDefinitionsService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
