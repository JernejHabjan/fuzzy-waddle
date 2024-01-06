import { TestBed } from "@angular/core/testing";

import { ProbableWaffleCommunicators, SceneCommunicatorClientService } from "./scene-communicator-client.service";
import { SceneCommunicatorClientServiceInterface } from "./scene-communicator-client.service.interface";

export const SceneCommunicatorClientServiceStub = {
  createCommunicators(gameInstanceId: string): ProbableWaffleCommunicators {
    return {} as ProbableWaffleCommunicators;
  },
  destroyCommunicators() {
    //
  }
} satisfies SceneCommunicatorClientServiceInterface;
describe("SceneCommunicatorClientService", () => {
  let service: SceneCommunicatorClientService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SceneCommunicatorClientService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
