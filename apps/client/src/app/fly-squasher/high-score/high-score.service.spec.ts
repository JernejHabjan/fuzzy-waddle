import { TestBed } from "@angular/core/testing";

import { HighScoreService } from "./high-score.service";
import { HttpClientTestingModule } from "@angular/common/http/testing";

export const highScoreServiceStub = {
  postScore: () => {},
  getScores: () => []
};

describe("HighScoreService", () => {
  let service: HighScoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(HighScoreService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
