import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { environment } from "@fuzzy-waddle/environments/environment";
import { ScoreSubmissionService } from "./score-submission.service";

describe("ScoreSubmissionService", () => {
  let service: ScoreSubmissionService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ScoreSubmissionService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it("submits a serializable score payload", () => {
    const response = { success: true, message: "stored" };
    service.submitScores("game-1", []).subscribe((value) => expect(value).toEqual(response));

    const request = httpTesting.expectOne(`${environment.api}api/probable-waffle/game-session/submit-scores`);
    expect(request.request.body).toEqual({
      gameInstanceId: "game-1",
      playerScores: [],
      snapshots: undefined
    });
    request.flush(response);
  });

  it("turns submission errors into a non-fatal result", () => {
    jest.spyOn(console, "error").mockImplementation();
    service
      .submitScores("game-1", [])
      .subscribe((value) => expect(value).toEqual({ success: false, message: "Failed to submit scores" }));

    httpTesting
      .expectOne(`${environment.api}api/probable-waffle/game-session/submit-scores`)
      .flush("failure", { status: 500, statusText: "Server Error" });
  });
});
