import { TestBed } from "@angular/core/testing";
import { SceneCommunicatorClientService } from "./scene-communicator-client.service";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";

describe("SceneCommunicatorClientService", () => {
  let service: SceneCommunicatorClientService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(SceneCommunicatorClientService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
