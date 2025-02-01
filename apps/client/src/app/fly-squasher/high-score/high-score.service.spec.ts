import { TestBed } from "@angular/core/testing";

import { HighScoreService } from "./high-score.service";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";

// noinspection JSUnusedGlobalSymbols
export const highScoreServiceStub = {
  postScore: () => {},
  getScores: () => []
};

describe("HighScoreService", () => {
  let service: HighScoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(HighScoreService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
