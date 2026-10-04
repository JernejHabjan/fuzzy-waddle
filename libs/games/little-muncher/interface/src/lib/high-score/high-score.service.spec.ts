import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { LittleMuncherHillEnum } from "@fuzzy-waddle/little-muncher-protocol";
import { ServerHealthService } from "@fuzzy-waddle/platform-game-host/angular/services/server-health.service";
import { AuthService } from "@fuzzy-waddle/platform-identity/client/auth/auth.service";
import { environment } from "@fuzzy-waddle/environments/environment";
import { HighScoreService } from "./high-score.service";

describe("HighScoreService", () => {
  let service: HighScoreService;
  let httpTesting: HttpTestingController;
  const authService = {
    isAuthenticated: true,
    fullName: "Test Player",
    userId: "user-1"
  };
  const serverHealthService = { serverAvailable: true };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authService },
        { provide: ServerHealthService, useValue: serverHealthService }
      ]
    });
    service = TestBed.inject(HighScoreService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it("posts an authenticated score while the server is available", async () => {
    const result = service.postScore(120, LittleMuncherHillEnum.Stefka);
    const request = httpTesting.expectOne(`${environment.api}api/little-muncher/post-score`);

    expect(request.request.method).toBe("POST");
    expect(request.request.body).toMatchObject({ score: 120, hill: LittleMuncherHillEnum.Stefka });
    request.flush(null);

    await result;
  });

  it("loads scores while the server is available", async () => {
    const response = [{ score: 90, hill: LittleMuncherHillEnum.Stefka, user_name: "Player", user_id: "user-1" }];
    const result = service.getScores();

    httpTesting.expectOne(`${environment.api}api/little-muncher/get-scores`).flush(response);

    await expect(result).resolves.toEqual(response);
  });
});
