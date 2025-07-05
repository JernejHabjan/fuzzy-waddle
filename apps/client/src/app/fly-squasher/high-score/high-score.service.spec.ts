import { TestBed } from "@angular/core/testing";

import { HighScoreService } from "./high-score.service";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { AuthService } from "../../auth/auth.service";
import { authServiceStub } from "../../auth/auth.service.stub";

// noinspection JSUnusedGlobalSymbols

describe("HighScoreService", () => {
  let service: HighScoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: AuthService, useValue: authServiceStub }]
    });
    service = TestBed.inject(HighScoreService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
