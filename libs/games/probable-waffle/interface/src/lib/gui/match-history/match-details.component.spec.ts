import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { of } from "rxjs";
import { AuthService } from "@fuzzy-waddle/platform-identity/client/auth/auth.service";
import { ServerHealthService } from "@fuzzy-waddle/platform-game-host/angular/services/server-health.service";
import { MatchHistoryService } from "../../services/match-history.service";
import { MatchDetailsComponent } from "./match-details.component";

describe("MatchDetailsComponent", () => {
  let fixture: ComponentFixture<MatchDetailsComponent>;
  const matchHistoryService = { getMatchDetails: jest.fn().mockReturnValue(of({})) };

  beforeEach(async () => {
    jest.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [MatchDetailsComponent],
      providers: [
        { provide: MatchHistoryService, useValue: matchHistoryService },
        { provide: AuthService, useValue: { isAuthenticated: true } },
        { provide: ServerHealthService, useValue: { serverAvailable: true } },
        { provide: Router, useValue: { navigate: jest.fn() } }
      ]
    })
      .overrideComponent(MatchDetailsComponent, {
        set: { imports: [], template: "" }
      })
      .compileComponents();

    fixture = TestBed.createComponent(MatchDetailsComponent);
    fixture.componentRef.setInput("gameInstanceId", "game-1");
  });

  it("loads the requested match", () => {
    fixture.detectChanges();

    expect(matchHistoryService.getMatchDetails).toHaveBeenCalledWith("game-1");
  });
});
