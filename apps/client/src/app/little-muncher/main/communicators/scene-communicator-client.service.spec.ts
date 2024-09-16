import { TestBed } from "@angular/core/testing";
import { SceneCommunicatorClientService } from "./scene-communicator-client.service";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { SceneCommunicatorClientServiceInterface } from "./scene-communicator-client.service.interface";
import { provideHttpClient } from "@angular/common/http";

export const SceneCommunicatorClientServiceStub = {
  startListeningToEvents() {
    //
  },
  stopListeningToEvents() {
    //
  }
} satisfies SceneCommunicatorClientServiceInterface;
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
