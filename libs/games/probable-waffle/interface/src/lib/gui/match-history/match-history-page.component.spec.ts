import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { of } from "rxjs";
import { AuthService } from "@fuzzy-waddle/platform-identity/client/auth/auth.service";
import { ServerHealthService } from "@fuzzy-waddle/platform-game-host/angular/services/server-health.service";
import { MatchHistoryService } from "../../services/match-history.service";
import { MatchHistoryPageComponent } from "./match-history-page.component";

describe("MatchHistoryPageComponent", () => {
  let fixture: ComponentFixture<MatchHistoryPageComponent>;
  const matchHistoryService = {
    getMatchHistory: jest.fn().mockReturnValue(of({ matches: [], total: 0 }))
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [MatchHistoryPageComponent],
      providers: [
        { provide: MatchHistoryService, useValue: matchHistoryService },
        { provide: AuthService, useValue: { isAuthenticated: true } },
        { provide: ServerHealthService, useValue: { serverAvailable: true } },
        { provide: Router, useValue: { navigate: jest.fn() } }
      ]
    })
      .overrideComponent(MatchHistoryPageComponent, {
        set: { imports: [], template: "" }
      })
      .compileComponents();

    fixture = TestBed.createComponent(MatchHistoryPageComponent);
  });

  it("loads the first page of match history", () => {
    fixture.detectChanges();

    expect(matchHistoryService.getMatchHistory).toHaveBeenCalledWith(20, 0);
  });
});
