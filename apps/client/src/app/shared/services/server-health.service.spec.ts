import { TestBed } from "@angular/core/testing";

import { ServerHealthService } from "./server-health.service";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ServerHealthServiceInterface } from "./server-health.service.interface";

export const serverHealthServiceStub = {
  checkHealth(): Promise<void> {
    return Promise.resolve();
  },
  get serverAvailable(): boolean {
    return true;
  },
  get serverChecking(): boolean {
    return false;
  },
  get serverUnavailable(): boolean {
    return false;
  }
} satisfies ServerHealthServiceInterface;

describe("ServerHealthService", () => {
  let service: ServerHealthService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ServerHealthService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
