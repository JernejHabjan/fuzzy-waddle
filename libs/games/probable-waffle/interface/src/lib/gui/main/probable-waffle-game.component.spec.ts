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
  ProbableWaffleGameInstanceVisibility
} from "@fuzzy-waddle/probable-waffle-protocol";

jest.mock("@fuzzy-waddle/probable-waffle-phaser/world/const/game-config", () => ({
  probableWaffleGameConfig: {}
}));

describe("ProbableWaffleGameComponent", () => {
  let component: ProbableWaffleGameComponent;
  let fixture: ComponentFixture<ProbableWaffleGameComponent>;

  beforeEach(async () => {
    window.sessionStorage.removeItem(AI_RUNTIME_BROWSER_TEST_CONFIG_KEY_V1);
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

    container.gameConfig()?.callbacks?.postBoot?.(game);

    expect(window.__fuzzyWaddleAiRuntimeBrowserTestV1).toEqual({
      schemaVersion: 1,
      config: { schemaVersion: 1, enabled: true, seed: 759008, startPaused: true },
      game,
      initialStateByPlayer: {}
    });
    fixture.destroy();
    expect(window.__fuzzyWaddleAiRuntimeBrowserTestV1).toBeUndefined();
  });
});
