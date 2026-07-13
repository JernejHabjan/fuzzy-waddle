import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, convertToParamMap, provideRouter } from "@angular/router";
import { MissionScreenComponent } from "./mission-screen.component";
import { CampaignLaunchService } from "../campaign-launch.service";
import { CampaignLaunchServiceStub } from "../campaign-launch.service.stub";
import { GameSaveService } from "../../../services/game-save/game-save.service";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { of } from "rxjs";

describe("MissionScreenComponent", () => {
  let fixture: ComponentFixture<MissionScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MissionScreenComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ chapterId: "prologue", missionId: "dreams" }) },
            paramMap: of(convertToParamMap({ chapterId: "prologue", missionId: "dreams" }))
          }
        },
        { provide: CampaignLaunchService, useValue: new CampaignLaunchServiceStub() },
        { provide: GameSaveService, useValue: { continueCampaignMission: async () => undefined } },
        { provide: GameInstanceClientService, useValue: { loadSavedGameData: async () => undefined } }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(MissionScreenComponent);
    fixture.detectChanges();
  });

  it("shows the selected mission briefing and an available start action", async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain("Dreams");
    expect(fixture.nativeElement.textContent).toContain("Start Mission");
  });
});
