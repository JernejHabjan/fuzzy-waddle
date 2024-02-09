import { TestBed } from "@angular/core/testing";
import { AuthenticatedSocketService } from "./authenticated-socket.service";
import { IAuthenticatedSocketService } from "./authenticated-socket.service.interface";
import { WrappedSocket } from "ngx-socket-io/src/socket-io.service";

export const createAuthenticatedSocketServiceStub = {
  get socket(): WrappedSocket | undefined {
    return undefined;
  }
} satisfies IAuthenticatedSocketService;

describe("AuthenticatedSocketService", () => {
  let service: AuthenticatedSocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthenticatedSocketService]
    });
    service = TestBed.inject(AuthenticatedSocketService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
