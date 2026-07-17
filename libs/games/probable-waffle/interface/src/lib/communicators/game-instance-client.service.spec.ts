import { TestBed } from "@angular/core/testing";

import { GameInstanceClientService } from "./game-instance-client.service";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { AuthService } from "@fuzzy-waddle/portal/auth/auth.service";
import { authServiceStub } from "@fuzzy-waddle/portal/auth/auth.service.stub";
import { provideRouter } from "@angular/router";
import { provideHttpClient } from "@angular/common/http";
import { GameSaveService } from "../services/game-save/game-save.service";
import {
  GameSaveScope,
  type ProbableWaffleGameInstance,
  ProbableWaffleGameInstanceType,
  ProbableWaffleGameInstanceVisibility
} from "@fuzzy-waddle/api-interfaces";

describe("GameInstanceClientService", () => {
  let service: GameInstanceClientService;
  const gameSaveService = { save: jest.fn() };

  beforeEach(() => {
    gameSaveService.save.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: authServiceStub },
        { provide: GameSaveService, useValue: gameSaveService }
      ]
    });
    service = TestBed.inject(GameInstanceClientService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("persists instant-game saves through the shared game-save service", async () => {
    service.gameInstance = {
      data: {
        gameInstanceMetadataData: {
          name: "Instant game",
          type: ProbableWaffleGameInstanceType.InstantGame,
          visibility: ProbableWaffleGameInstanceVisibility.Private,
          startOptions: {},
          rndSeed: 1
        }
      }
    } as ProbableWaffleGameInstance;

    await service.saveGameInstance({ kind: "manual", name: "Instant save", thumbnail: "thumbnail" });

    expect(gameSaveService.save).toHaveBeenCalledWith(
      expect.objectContaining({ scope: GameSaveScope.Skirmish, name: "Instant save", thumbnail: "thumbnail" })
    );
  });
});
