import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ScoreScreenComponent } from "./score-screen.component";
import { ScoreThroughTimeComponent } from "./chart/score-through-time.component";
import { ScoreThroughTimeTestingComponent } from "./chart/score-through-time.component.spec";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "../../communicators/game-instance-client.service.stub";
import { provideRouter } from "@angular/router";
import { CampaignProgressService } from "../campaign/campaign-progress.service";

describe("ScoreScreenComponent", () => {
  let component: ScoreScreenComponent;
  let fixture: ComponentFixture<ScoreScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScoreScreenComponent],
      providers: [
        provideRouter([]),
        { provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub },
        { provide: CampaignProgressService, useValue: { recordResult: async () => undefined } }
      ]
    })
      .overrideComponent(ScoreScreenComponent, {
        remove: {
          imports: [ScoreThroughTimeComponent]
        },
        add: {
          imports: [ScoreThroughTimeTestingComponent]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(ScoreScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
