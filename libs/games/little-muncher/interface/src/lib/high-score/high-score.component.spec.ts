import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ServerHealthService } from "@fuzzy-waddle/platform-game-host/angular/services/server-health.service";
import { HighScoreComponent } from "./high-score.component";
import { HighScoreService } from "./high-score.service";

describe("HighScoreComponent", () => {
  let fixture: ComponentFixture<HighScoreComponent>;
  const highScoreService = { getScores: jest.fn().mockResolvedValue([]) };
  const serverHealthService = {
    serverAvailable: true,
    checkHealth: jest.fn().mockResolvedValue(undefined)
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [HighScoreComponent],
      providers: [
        { provide: HighScoreService, useValue: highScoreService },
        { provide: ServerHealthService, useValue: serverHealthService }
      ]
    })
      .overrideComponent(HighScoreComponent, {
        set: { imports: [], template: "" }
      })
      .compileComponents();

    fixture = TestBed.createComponent(HighScoreComponent);
  });

  it("checks server health and loads scores", async () => {
    await fixture.componentInstance.ngOnInit();

    expect(serverHealthService.checkHealth).toHaveBeenCalledTimes(1);
    expect(highScoreService.getScores).toHaveBeenCalledTimes(1);
  });
});
