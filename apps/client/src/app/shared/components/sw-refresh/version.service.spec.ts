import { TestBed } from "@angular/core/testing";

import { VersionService, VersionState } from "./version.service";
import { VersionServiceInterface } from "./version.service.interface";
import { SwUpdate } from "@angular/service-worker";
import { signal } from "@angular/core";

export const versionServiceStub = {
  versionState: signal(VersionState.VersionOk),
  onVersionRefreshClick: () => {}
} satisfies VersionServiceInterface;

describe("VersionService", () => {
  let service: VersionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SwUpdate,
          useValue: {}
        }
      ]
    });
    service = TestBed.inject(VersionService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
