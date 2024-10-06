import { TestBed } from "@angular/core/testing";
import { AuthenticatedSocketService } from "./authenticated-socket.service";
import { IAuthenticatedSocketService } from "./authenticated-socket.service.interface";
import { Socket } from "ngx-socket-io";
import { ServerHealthService } from "../../shared/services/server-health.service";
import { serverHealthServiceStub } from "../../shared/services/server-health.service.spec";

export const createAuthenticatedSocketServiceStub = {
  async getSocket(): Promise<Socket | undefined> {
    return undefined;
  }
} satisfies IAuthenticatedSocketService;

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
