import { TestBed } from "@angular/core/testing";

import { GameInstanceClientService } from "./game-instance-client.service";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { AuthService } from "@fuzzy-waddle/platform-identity/client/auth/auth.service";
import { authServiceStub } from "@fuzzy-waddle/platform-identity/client/auth/auth.service.stub";
import { provideRouter } from "@angular/router";
import { provideHttpClient } from "@angular/common/http";
import { GameSaveService } from "../services/game-save/game-save.service";
import {
  CAMPAIGN_MISSION_RUNTIME_SCHEMA_VERSION,
  GameSaveScope,
  type ProbableWaffleGameInstance,
  ProbableWaffleGameInstanceType,
  ProbableWaffleGameInstanceVisibility
} from "@fuzzy-waddle/probable-waffle-protocol";

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

  it("persists campaign content identity in the searchable save context", async () => {
    service.gameInstance = {
      data: {
        gameInstanceMetadataData: {
          name: "Dreams",
          type: ProbableWaffleGameInstanceType.Campaign,
          visibility: ProbableWaffleGameInstanceVisibility.Private,
          startOptions: {},
          rndSeed: 1,
          campaignContext: {
            campaignId: "ashes-of-the-ancients",
            catalogVersion: 1,
            chapterId: "prologue",
            missionId: "dreams",
            missionRevision: 1,
            runId: "run-1",
            selectedLoadoutIds: ["primary"],
            loadoutSnapshotHash: "12345678"
          }
        }
      }
    } as ProbableWaffleGameInstance;

    await service.saveGameInstance({ kind: "manual", name: "Dream checkpoint" });

    expect(gameSaveService.save).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: GameSaveScope.Campaign,
        campaign: expect.objectContaining({
          campaignId: "ashes-of-the-ancients",
          chapterId: "prologue",
          missionId: "dreams",
          missionRevision: 1,
          runId: "run-1",
          runtimeSchemaVersion: CAMPAIGN_MISSION_RUNTIME_SCHEMA_VERSION,
          profileRevision: 0,
          selectedLoadoutIds: ["primary"],
          loadoutSnapshotHash: "12345678",
          participantCount: 1
        })
      })
    );
  });
});
