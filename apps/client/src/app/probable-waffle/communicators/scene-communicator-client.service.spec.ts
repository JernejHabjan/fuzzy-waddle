import { TestBed } from "@angular/core/testing";

import { SceneCommunicatorClientService } from "./scene-communicator-client.service";
import { SceneCommunicatorClientServiceInterface } from "./scene-communicator-client.service.interface";
import { AuthService } from "../../auth/auth.service";
import { authServiceStub } from "../../auth/auth.service.spec";
import { ServerHealthService } from "../../shared/services/server-health.service";
import { serverHealthServiceStub } from "../../shared/services/server-health.service.spec";

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
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceStub },
        { provide: ServerHealthService, useValue: serverHealthServiceStub }
      ]
    });
    service = TestBed.inject(SceneCommunicatorClientService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
