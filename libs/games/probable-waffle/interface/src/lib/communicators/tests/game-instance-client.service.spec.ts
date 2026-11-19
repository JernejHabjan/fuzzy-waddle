import { TestBed } from "@angular/core/testing";

import { GameInstanceClientService } from "../game-instance-client.service";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { AuthService } from "@fuzzy-waddle/platform-identity/client/auth/auth.service";
import { authServiceStub } from "@fuzzy-waddle/platform-identity/client/auth/auth.service.stub";
import { CurrentUserProfileService } from "@fuzzy-waddle/platform-identity/client/profile-data/current-user-profile.service";
import { provideRouter } from "@angular/router";
import { ServerHealthService } from "@fuzzy-waddle/platform-game-host/angular/services/server-health.service";
import { provideHttpClient } from "@angular/common/http";
import { GameSaveService } from "../../services/game-save/game-save.service";
import { SceneCommunicatorClientService } from "../scene-communicator-client.service";
import { Subscription } from "rxjs";
import {
  CAMPAIGN_MISSION_RUNTIME_SCHEMA_VERSION,
  FactionType,
  GameSaveScope,
  ProbableWaffleGameInstance,
  ProbableWaffleGameState,
  ProbableWaffleAiDifficulty,
  ProbableWafflePlayerType,
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

  it("does not register explicit local previews with the server and keeps their selected AI difficulty", async () => {
    const authentication = jest.spyOn(authServiceStub, "isAuthenticated", "get").mockReturnValue(true);
    const server = TestBed.inject(ServerHealthService);
    const availability = jest.spyOn(server, "serverAvailable", "get").mockReturnValue(true);
    try {
      await service.createGameInstance("AI preview", ProbableWaffleGameInstanceVisibility.Private,
        ProbableWaffleGameInstanceType.InstantGame, { localOnly: true });
      const ai = await service.addAiPlayer(undefined, { difficulty: ProbableWaffleAiDifficulty.Easy });
      expect(ai.difficulty).toBe(ProbableWaffleAiDifficulty.Easy);
      TestBed.inject(HttpTestingController).expectNone((request) => request.url.endsWith("/start-game"));
    } finally {
      authentication.mockRestore();
      availability.mockRestore();
    }
  });

  it("opens a caller-configured player slot without replacing its faction or team", async () => {
    service.gameInstance = new ProbableWaffleGameInstance();
    const playerDefinition = {
      player: { playerNumber: 1, playerName: "Scenario opponent", playerPosition: 0, joined: false },
      playerType: ProbableWafflePlayerType.NetworkOpen,
      factionType: FactionType.Skaduwee,
      team: 1
    };
    const changed = jest.spyOn(service, "playerChanged").mockResolvedValue();

    try {
      await service.playerSlotOpened(playerDefinition);

      expect(changed).toHaveBeenCalledWith("joined", {
        playerControllerData: { playerDefinition }
      });
    } finally {
      changed.mockRestore();
    }
  });

  it("rejects a spectator join after its match is replaced during profile lookup", async () => {
    let releaseProfile!: () => void;
    const profile = jest.spyOn(TestBed.inject(CurrentUserProfileService), "getCurrentUserProfile").mockImplementation(
      () =>
        new Promise((resolve) => {
          releaseProfile = () => resolve(null);
        })
    );
    try {
      service.gameInstance = new ProbableWaffleGameInstance();
      const joining = service.addSelfAsSpectator();
      service.gameInstance = new ProbableWaffleGameInstance();
      releaseProfile();
      await expect(joining).rejects.toThrow("The local match was replaced.");
    } finally {
      profile.mockRestore();
    }
  });

  it("does not start a replacement match during lobby setup", async () => {
    service.gameInstance = new ProbableWaffleGameInstance();
    const changed = jest.spyOn(service, "gameInstanceMetadataChanged");
    const starting = service.startGame();
    service.gameInstance = new ProbableWaffleGameInstance();
    await expect(starting).rejects.toThrow("The local match was replaced.");
    expect(changed).not.toHaveBeenCalled();
  });

  it.each([1, 2])("restores the unique offline human slot with %s AI players", (aiCount) => {
    const game = new ProbableWaffleGameInstance();
    game.gameInstanceMetadata.data.type = ProbableWaffleGameInstanceType.Skirmish;
    for (let index = 0; index <= aiCount; index++) {
      game.players.push(
        game.initPlayer({
          userId: null,
          playerDefinition: {
            player: { playerNumber: index + 1, joined: true },
            playerType: index === aiCount ? ProbableWafflePlayerType.Human : ProbableWafflePlayerType.AI
          }
        })
      );
    }
    service.gameInstance = game;
    (
      service as unknown as { syncCurrentPlayerNumberFromGameInstance(): void }
    ).syncCurrentPlayerNumberFromGameInstance();
    expect(service.currentPlayerNumber).toBe(aiCount + 1);
  });

  it("preserves a new match if an older instance cleanup finishes after replacement", async () => {
    let release: (() => void) | undefined;
    jest.spyOn(TestBed.inject(SceneCommunicatorClientService), "destroyCommunicators").mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        })
    );
    const original = { marker: "old" } as unknown as ProbableWaffleGameInstance;
    const replacement = { marker: "new" } as unknown as ProbableWaffleGameInstance;
    const listener = new Subscription();
    service.gameInstance = original;
    Reflect.set(service, "communicatorInstanceId", "old");
    Reflect.set(service, "communicatorSubscriptions", [listener]);
    const cleanup = (service as unknown as { cleanupLocalGameState(): Promise<void> }).cleanupLocalGameState();
    expect(listener.closed).toBe(true);
    service.gameInstance = replacement;
    service.currentPlayerNumber = 7;
    if (!release) throw new Error("Old cleanup did not reach storage boundary");
    release();
    await cleanup;
    expect(service.gameInstance).toBe(replacement);
    expect(service.currentPlayerNumber).toBe(7);
  });

  it("uses the captured world rather than later live state after thumbnail and naming delays", async () => {
    const instance = new ProbableWaffleGameInstance();
    instance.gameState = new ProbableWaffleGameState({ actors: [], pause: false, score: 0, simulationTick: 900 });
    service.gameInstance = instance;
    const captured = { ...instance.data, gameStateData: structuredClone(instance.gameState.data) };
    captured.gameStateData.simulationTick = 200;
    await service.saveGameInstance({
      kind: "manual",
      name: "Captured boundary",
      thumbnail: "image",
      gameInstanceData: captured
    });
    captured.gameStateData.simulationTick = 1000;
    expect(gameSaveService.save).toHaveBeenCalledWith(
      expect.objectContaining({
        gameInstanceData: expect.objectContaining({ gameStateData: expect.objectContaining({ simulationTick: 200 }) })
      })
    );
  });

  it("persists instant-game saves through the shared game-save service", async () => {
    service.gameInstance = new ProbableWaffleGameInstance({
      gameInstanceMetadataData: {
        createdBy: null,
        name: "Instant game",
        type: ProbableWaffleGameInstanceType.InstantGame,
        visibility: ProbableWaffleGameInstanceVisibility.Private,
        startOptions: {},
        rndSeed: 1
      }
    });

    await service.saveGameInstance({ kind: "manual", name: "Instant save", thumbnail: "thumbnail" });

    expect(gameSaveService.save).toHaveBeenCalledWith(
      expect.objectContaining({ scope: GameSaveScope.Skirmish, name: "Instant save", thumbnail: "thumbnail" })
    );
  });

  it("persists campaign content identity in the searchable save context", async () => {
    service.gameInstance = new ProbableWaffleGameInstance({
      gameInstanceMetadataData: {
        createdBy: null,
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
    });

    await service.saveGameInstance({ kind: "manual", name: "Dream checkpoint", thumbnail: "" });

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
