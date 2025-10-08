import { TestBed } from "@angular/core/testing";

import { SceneCommunicatorClientService } from "./scene-communicator-client.service";
import { AuthenticatedSocketService } from "../../data-access/chat/authenticated-socket.service";
import { createAuthenticatedSocketServiceStub } from "../../data-access/chat/authenticated-socket.service.stub";

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
