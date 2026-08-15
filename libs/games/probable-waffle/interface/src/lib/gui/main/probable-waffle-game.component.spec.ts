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
import { OptionsService } from "../options/options.service";

jest.mock("@fuzzy-waddle/probable-waffle-phaser/world/const/game-config", () => ({
  probableWaffleGameConfig: {}
}));

describe("ProbableWaffleGameComponent", () => {
  let component: ProbableWaffleGameComponent;
  let fixture: ComponentFixture<ProbableWaffleGameComponent>;
  const optionsService = { init: jest.fn(() => Promise.resolve()) };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub },
        { provide: AchievementService, useValue: achievementServiceStub },
        { provide: GameSaveService, useValue: new GameSaveServiceStub() },
        { provide: OptionsService, useValue: optionsService }
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
    expect(optionsService.init).toHaveBeenCalled();
  });
});
