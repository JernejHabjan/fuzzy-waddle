import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ScoreThroughTimeComponent } from "./score-through-time.component";

import { ProbableWaffleGameInstanceType, ProbableWaffleGameInstanceVisibility } from "@fuzzy-waddle/api-interfaces";
import { gameInstanceClientServiceStub } from "../../../communicators/game-instance-client.service.stub";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { ScoreDataService } from "../../../services/score-data.service";

describe("ScoreThroughTimeComponent", () => {
  let component: ScoreThroughTimeComponent;
  let fixture: ComponentFixture<ScoreThroughTimeComponent>;

  const scoreDataServiceStub = {
    getScoreSnapshots: () => []
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScoreThroughTimeComponent],
      providers: [
        { provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub },
        { provide: ScoreDataService, useValue: scoreDataServiceStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ScoreThroughTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should show no-data when snapshots are empty", async () => {
    await gameInstanceClientServiceStub.createGameInstance(
      "test",
      ProbableWaffleGameInstanceVisibility.Private,
      ProbableWaffleGameInstanceType.Skirmish
    );

    component.ngOnInit();

    expect(component).toBeTruthy();
  });
});
