import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ProbableWaffleGameComponent } from "./probable-waffle-game.component";
import { GameContainerTestingComponent } from "@fuzzy-waddle/platform-game-host/game-container/game-container.component.spec";
import { gameInstanceClientServiceStub } from "../../communicators/game-instance-client.service.stub";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { GameContainerComponent } from "@fuzzy-waddle/platform-game-host/game-container/game-container.component";
import { AchievementService } from "../../services/achievement/achievement.service";
import { achievementServiceStub } from "../../services/achievement/achievement.service.stub";
import { GameSaveService } from "../../services/game-save/game-save.service";
import { GameSaveServiceStub } from "../../services/game-save/game-save.service.stub";
import type Phaser from "phaser";
import { By } from "@angular/platform-browser";
import { AI_RUNTIME_BROWSER_TEST_CONFIG_KEY_V1 } from "./ai-runtime-browser-test-host";
import {
  ProbableWaffleGameInstanceType,
  ProbableWaffleGameInstanceVisibility,
  ProbableWafflePlayerType, ProbableWaffleAiDifficulty, FactionType
} from "@fuzzy-waddle/probable-waffle-protocol";

jest.mock("@fuzzy-waddle/probable-waffle-phaser/world/const/game-config", () => ({
  probableWaffleGameConfig: {}
}));

describe("ProbableWaffleGameComponent", () => {
  let component: ProbableWaffleGameComponent;
  let fixture: ComponentFixture<ProbableWaffleGameComponent>;

  beforeEach(async () => {
    window.sessionStorage.removeItem(AI_RUNTIME_BROWSER_TEST_CONFIG_KEY_V1);
    window.sessionStorage.removeItem("fuzzy-waddle:ai-multiplayer-browser-test-v1");
    delete window.__fuzzyWaddleAiRuntimeBrowserTestV1;
    await TestBed.configureTestingModule({
      providers: [
        { provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub },
        { provide: AchievementService, useValue: achievementServiceStub },
        { provide: GameSaveService, useValue: new GameSaveServiceStub() }
      ],
      imports: [ProbableWaffleGameComponent]
    })
      .overrideComponent(ProbableWaffleGameComponent, {
        remove: {
          imports: [GameContainerComponent]
        },
        add: {
          imports: [GameContainerTestingComponent]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(ProbableWaffleGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("configures only two fresh native AI roles for explicit calibration without changing legal banks or factions", async () => {
    fixture.destroy();
    await gameInstanceClientServiceStub.createGameInstance("calibration", ProbableWaffleGameInstanceVisibility.Private,
      ProbableWaffleGameInstanceType.Skirmish);
    const instance = gameInstanceClientServiceStub.gameInstance!;
    instance.addPlayer(instance.initPlayer({ userId: "1", playerDefinition: { playerType: ProbableWafflePlayerType.Human,
      factionType: FactionType.Tivara, player: { playerNumber: 1, joined: true } } }));
    instance.addPlayer(instance.initPlayer({ playerDefinition: { playerType: ProbableWafflePlayerType.AI,
      factionType: FactionType.Skaduwee, player: { playerNumber: 2, joined: true } } }));
    const banks = JSON.stringify(instance.players.map((player) => player.playerState.data.resources));
    window.sessionStorage.setItem(AI_RUNTIME_BROWSER_TEST_CONFIG_KEY_V1, JSON.stringify({
      schemaVersion: 1, enabled: true, seed: 759061, startPaused: true,
      calibration: { targetPlayerNumber: 1, difficulty: "Hard", opponentArchetype: "rush" }
    }));
    fixture = TestBed.createComponent(ProbableWaffleGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(instance.players.map((player) => player.playerController.data.playerDefinition?.playerType))
      .toEqual([ProbableWafflePlayerType.AI, ProbableWafflePlayerType.AI]);
    expect(instance.players.map((player) => player.playerController.data.playerDefinition?.difficulty))
      .toEqual([ProbableWaffleAiDifficulty.Hard, ProbableWaffleAiDifficulty.Medium]);
    expect(instance.players.map((player) => player.playerController.data.playerDefinition?.factionType))
      .toEqual([FactionType.Tivara, FactionType.Skaduwee]);
    expect(JSON.stringify(instance.players.map((player) => player.playerState.data.resources))).toBe(banks);
  });

  it("publishes and clears the real game only for an explicit developer runtime session", async () => {
    fixture.destroy();
    await gameInstanceClientServiceStub.createGameInstance(
      "runtime-test",
      ProbableWaffleGameInstanceVisibility.Private,
      ProbableWaffleGameInstanceType.Skirmish
    );
    window.sessionStorage.setItem(
      AI_RUNTIME_BROWSER_TEST_CONFIG_KEY_V1,
      JSON.stringify({ schemaVersion: 1, enabled: true, seed: 759008, startPaused: true })
    );
    fixture = TestBed.createComponent(ProbableWaffleGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    const container = fixture.debugElement.query(By.directive(GameContainerTestingComponent))
      .componentInstance as GameContainerTestingComponent;
    const game = {} as Phaser.Game;

    expect(gameInstanceClientServiceStub.gameInstance!.gameInstanceMetadata.data.gameInstanceId).toBe(
      "runtime-fixture-759008-continuous"
    );

    container.gameConfig()?.callbacks?.postBoot?.(game);

    expect(window.__fuzzyWaddleAiRuntimeBrowserTestV1).toEqual({
      schemaVersion: 1,
      config: { schemaVersion: 1, enabled: true, seed: 759008, startPaused: true },
      game,
      initialStateByPlayer: {},
      captureRuntimeArtifact: expect.any(Function),
      armIncidentCaptureProbe: expect.any(Function)
    });
    fixture.destroy();
    expect(window.__fuzzyWaddleAiRuntimeBrowserTestV1).toBeUndefined();
  });

  it("preserves saved session identity and RNG seed when the developer probe survives a native reload", async () => {
    fixture.destroy();
    await gameInstanceClientServiceStub.createGameInstance(
      "saved-runtime-test",
      ProbableWaffleGameInstanceVisibility.Private,
      ProbableWaffleGameInstanceType.Skirmish
    );
    const metadata = gameInstanceClientServiceStub.gameInstance!.gameInstanceMetadata.data;
    metadata.startOptions.loadFromSave = true;
    metadata.rndSeed = 12345;
    metadata.gameInstanceId = "actual-saved-session";
    window.sessionStorage.setItem(AI_RUNTIME_BROWSER_TEST_CONFIG_KEY_V1,
      JSON.stringify({ schemaVersion: 1, enabled: true, seed: 759008, startPaused: true }));
    fixture = TestBed.createComponent(ProbableWaffleGameComponent);
    fixture.detectChanges();
    const container = fixture.debugElement.query(By.directive(GameContainerTestingComponent))
      .componentInstance as GameContainerTestingComponent;
    expect(metadata.rndSeed).toBe(12345);
    expect(metadata.gameInstanceId).toBe("actual-saved-session");
    expect(container.gameConfig()?.seed).toEqual(["12345"]);
    const game = {} as Phaser.Game;
    container.gameConfig()?.callbacks?.postBoot?.(game);
    expect(window.__fuzzyWaddleAiRuntimeBrowserTestV1?.game).toBe(game);
    fixture.destroy();
  });

  it("publishes a separate local multiplayer observer without replacing the network seed", async () => {
    fixture.destroy();
    await gameInstanceClientServiceStub.createGameInstance(
      "relay-test",
      ProbableWaffleGameInstanceVisibility.Private,
      ProbableWaffleGameInstanceType.SelfHosted
    );
    const originalSeed = gameInstanceClientServiceStub.gameInstance!.gameInstanceMetadata.data.rndSeed;
    const originalId = gameInstanceClientServiceStub.gameInstance!.gameInstanceMetadata.data.gameInstanceId;
    window.sessionStorage.setItem("fuzzy-waddle:ai-multiplayer-browser-test-v1", "1");
    fixture = TestBed.createComponent(ProbableWaffleGameComponent);
    fixture.detectChanges();
    const container = fixture.debugElement.query(By.directive(GameContainerTestingComponent))
      .componentInstance as GameContainerTestingComponent;
    const game = {} as Phaser.Game;
    container.gameConfig()?.callbacks?.postBoot?.(game);
    const observed = window as typeof window & { __fuzzyWaddleAiMultiplayerBrowserTestV1?: { game: Phaser.Game } };
    expect(observed.__fuzzyWaddleAiMultiplayerBrowserTestV1?.game).toBe(game);
    expect(window.__fuzzyWaddleAiRuntimeBrowserTestV1).toBeUndefined();
    expect(gameInstanceClientServiceStub.gameInstance!.gameInstanceMetadata.data.rndSeed).toBe(originalSeed);
    expect(gameInstanceClientServiceStub.gameInstance!.gameInstanceMetadata.data.gameInstanceId).toBe(originalId);
    fixture.destroy();
    expect(observed.__fuzzyWaddleAiMultiplayerBrowserTestV1).toBeUndefined();
  });
});
