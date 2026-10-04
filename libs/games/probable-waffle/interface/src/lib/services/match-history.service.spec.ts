import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { environment } from "@fuzzy-waddle/environments/environment";
import { MatchHistoryService } from "./match-history.service";

describe("MatchHistoryService", () => {
  let service: MatchHistoryService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(MatchHistoryService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it("loads a paginated match history", () => {
    const response = { matches: [], total: 0 };

    service.getMatchHistory(10, 20).subscribe((value) => expect(value).toEqual(response));

    const request = httpTesting.expectOne(
      (candidate) =>
        candidate.url === `${environment.api}api/probable-waffle/game-session/match-history` &&
        candidate.params.get("limit") === "10" &&
        candidate.params.get("offset") === "20"
    );
    expect(request.request.method).toBe("GET");
    request.flush(response);
  });

  it("loads match details by game instance ID", () => {
    service.getMatchDetails("game-1").subscribe();

    const request = httpTesting.expectOne(`${environment.api}api/probable-waffle/game-session/game-1/details`);
    expect(request.request.method).toBe("GET");
    request.flush({});
  });
});
