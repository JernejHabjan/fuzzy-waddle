import { TestBed } from "@angular/core/testing";

import { ProbableWaffleCommunicators, SceneCommunicatorClientService } from "./scene-communicator-client.service";
import { SceneCommunicatorClientServiceInterface } from "./scene-communicator-client.service.interface";
import { AuthenticatedSocketService } from "../../data-access/chat/authenticated-socket.service";
import { createAuthenticatedSocketServiceStub } from "../../data-access/chat/authenticated-socket.service.spec";

export const SceneCommunicatorClientServiceStub = {
  createCommunicators(gameInstanceId: string): Promise<ProbableWaffleCommunicators> {
    return Promise.resolve({} as ProbableWaffleCommunicators);
  },
  destroyCommunicators(): Promise<void> {
    return Promise.resolve();
  }
} satisfies SceneCommunicatorClientServiceInterface;
describe("SceneCommunicatorClientService", () => {
  let service: SceneCommunicatorClientService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthenticatedSocketService, useValue: createAuthenticatedSocketServiceStub }]
    });
    service = TestBed.inject(SceneCommunicatorClientService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
