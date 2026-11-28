import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ProbableWaffleGameComponent } from "../probable-waffle-game.component";
import { GameContainerTestingComponent } from "@fuzzy-waddle/platform-game-host/game-container/game-container.component.spec";
import { gameInstanceClientServiceStub } from "../../../communicators/game-instance-client.service.stub";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { GameContainerComponent } from "@fuzzy-waddle/platform-game-host/game-container/game-container.component";
import { AchievementService } from "../../../services/achievement/achievement.service";
import { achievementServiceStub } from "../../../services/achievement/achievement.service.stub";
import { GameSaveService } from "../../../services/game-save/game-save.service";
import { GameSaveServiceStub } from "../../../services/game-save/game-save.service.stub";
import type Phaser from "phaser";
import { By } from "@angular/platform-browser";
import { provideRouter } from "@angular/router";
import { AI_RUNTIME_BROWSER_TEST_CONFIG_KEY } from "../ai-runtime-browser-test-host";
import { activeAiScenarios } from "../../ai-scenarios/active-ai-scenario";
import {
  ProbableWaffleGameInstanceType,
  ProbableWaffleGameInstanceVisibility
} from "@fuzzy-waddle/probable-waffle-protocol";

jest.mock("@fuzzy-waddle/probable-waffle-phaser/world/const/game-config", () => ({
  probableWaffleGameConfig: {}
}));

describe("ProbableWaffleGameComponent", () => {
  let component: ProbableWaffleGameComponent;
  let fixture: ComponentFixture<ProbableWaffleGameComponent>;

  beforeEach(async () => {
    window.sessionStorage.removeItem(AI_RUNTIME_BROWSER_TEST_CONFIG_KEY);
    window.sessionStorage.removeItem("fuzzy-waddle:ai-multiplayer-browser-test");
    delete window.__fuzzyWaddleAiRuntimeBrowserTest;
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
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

  it("binds interactive playback to the local match without changing its routing identity", async () => {
    fixture.destroy();
    await gameInstanceClientServiceStub.createGameInstance("C-05", ProbableWaffleGameInstanceVisibility.Private,
      ProbableWaffleGameInstanceType.InstantGame);
    const instance = gameInstanceClientServiceStub.gameInstance!;
    const id = instance.gameInstanceMetadata.data.gameInstanceId;
    activeAiScenarios.set(instance, { title: "C-05 · bait", config: {
      schemaVersion: 1, enabled: true, startPaused: true, seed: 759940
    } });
    fixture = TestBed.createComponent(ProbableWaffleGameComponent);
    fixture.detectChanges();
    const container = fixture.debugElement.query(By.directive(GameContainerTestingComponent))
      .componentInstance as GameContainerTestingComponent;
    container.gameConfig()?.callbacks?.postBoot?.({} as Phaser.Game);
    expect(window.__fuzzyWaddleAiRuntimeBrowserTest?.interactive).toBe(true);
    expect(instance.gameInstanceMetadata.data.gameInstanceId).toBe(id);
    expect(container.gameConfig()?.seed).toEqual(["759940"]);
    expect(fixture.nativeElement.textContent).toContain("C-05 · bait");
    expect(window.sessionStorage.getItem(AI_RUNTIME_BROWSER_TEST_CONFIG_KEY)).toBeNull();
  });

  it("publishes and clears the real game only for an explicit developer runtime session", async () => {
    fixture.destroy();
    await gameInstanceClientServiceStub.createGameInstance(
      "runtime-test",
      ProbableWaffleGameInstanceVisibility.Private,
      ProbableWaffleGameInstanceType.Skirmish
    );
    window.sessionStorage.setItem(
      AI_RUNTIME_BROWSER_TEST_CONFIG_KEY,
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

    expect(window.__fuzzyWaddleAiRuntimeBrowserTest).toEqual({
      schemaVersion: 1,
      config: { schemaVersion: 1, enabled: true, seed: 759008, startPaused: true },
      game,
      initialStateByPlayer: {},
      captureRuntimeArtifact: expect.any(Function),
      armIncidentCaptureProbe: expect.any(Function)
    });
    fixture.destroy();
    expect(window.__fuzzyWaddleAiRuntimeBrowserTest).toBeUndefined();
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
    window.sessionStorage.setItem(AI_RUNTIME_BROWSER_TEST_CONFIG_KEY,
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
    expect(window.__fuzzyWaddleAiRuntimeBrowserTest?.game).toBe(game);
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
    window.sessionStorage.setItem("fuzzy-waddle:ai-multiplayer-browser-test", "1");
    fixture = TestBed.createComponent(ProbableWaffleGameComponent);
    fixture.detectChanges();
    const container = fixture.debugElement.query(By.directive(GameContainerTestingComponent))
      .componentInstance as GameContainerTestingComponent;
    const game = {} as Phaser.Game;
    container.gameConfig()?.callbacks?.postBoot?.(game);
    const observed = window as typeof window & { __fuzzyWaddleAiMultiplayerBrowserTest?: { game: Phaser.Game } };
    expect(observed.__fuzzyWaddleAiMultiplayerBrowserTest?.game).toBe(game);
    expect(window.__fuzzyWaddleAiRuntimeBrowserTest).toBeUndefined();
    expect(gameInstanceClientServiceStub.gameInstance!.gameInstanceMetadata.data.rndSeed).toBe(originalSeed);
    expect(gameInstanceClientServiceStub.gameInstance!.gameInstanceMetadata.data.gameInstanceId).toBe(originalId);
    fixture.destroy();
    expect(observed.__fuzzyWaddleAiMultiplayerBrowserTest).toBeUndefined();
  });
});
