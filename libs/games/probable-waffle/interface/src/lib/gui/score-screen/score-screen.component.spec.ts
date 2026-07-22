import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
  campaignResultCommitRequest,
  completedCampaignObjectiveIds,
  ScoreScreenComponent
} from "./score-screen.component";
import { ScoreThroughTimeComponent } from "./chart/score-through-time.component";
import { ScoreThroughTimeTestingComponent } from "./chart/score-through-time.component.spec";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "../../communicators/game-instance-client.service.stub";
import { provideRouter } from "@angular/router";
import { CampaignProgressService } from "../campaign/campaign-progress.service";
import { CampaignProgressServiceStub } from "../campaign/campaign-progress.service.stub";

describe("ScoreScreenComponent", () => {
  let component: ScoreScreenComponent;
  let fixture: ComponentFixture<ScoreScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScoreScreenComponent],
      providers: [
        provideRouter([]),
        { provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub },
        { provide: CampaignProgressService, useValue: CampaignProgressServiceStub }
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

  it("projects completed campaign objectives into stable result order", () => {
    expect(
      completedCampaignObjectiveIds({
        objectives: {
          secondary: { status: "failed" },
          primary: { status: "completed" },
          optional: { status: "completed" }
        }
      } as never)
    ).toEqual(["optional", "primary"]);
  });

  it("projects the frozen progression revision, discoveries, and integrity into the commit request", () => {
    const request = campaignResultCommitRequest(
      {
        campaignId: "ashes-of-the-ancients",
        catalogVersion: 1,
        chapterId: "prologue",
        missionId: "dreams",
        missionRevision: 2,
        runId: "run-1"
      },
      {
        difficulty: { difficulty: "hard" },
        claimedRewardIds: ["story", "secret"],
        progression: { baseProfileRevision: 7 },
        rewardIntegrity: { eligibleForRewards: false, invalidationReasons: ["developer-command"] },
        objectives: {}
      } as never,
      "victory",
      false
    );

    expect(request).toMatchObject({
      missionRevision: 2,
      baseProfileRevision: 7,
      discoveredRewardIds: ["secret", "story"],
      difficulty: "hard",
      integrity: { eligibleForRewards: false }
    });
  });
});
