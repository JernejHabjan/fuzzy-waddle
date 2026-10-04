import { TestBed } from "@angular/core/testing";

import { ServerHealthService } from "./server-health.service";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";

describe("ServerHealthService", () => {
  let service: ServerHealthService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ServerHealthService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
