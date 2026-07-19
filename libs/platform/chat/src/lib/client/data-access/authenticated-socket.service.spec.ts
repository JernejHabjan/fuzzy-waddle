import { TestBed } from "@angular/core/testing";
import { AuthenticatedSocketService } from "./authenticated-socket.service";
import { ServerHealthService } from "@fuzzy-waddle/platform-game-host/angular/services/server-health.service";
import { serverHealthServiceStub } from "@fuzzy-waddle/platform-game-host/angular/services/server-health.service.stub";

describe("AuthenticatedSocketService", () => {
  let service: AuthenticatedSocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthenticatedSocketService, { provide: ServerHealthService, useValue: serverHealthServiceStub }]
    });
    service = TestBed.inject(AuthenticatedSocketService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
