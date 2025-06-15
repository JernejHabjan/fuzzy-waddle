import { TestBed } from "@angular/core/testing";

import { VersionService, VersionState } from "./version.service";
import { VersionServiceInterface } from "./version.service.interface";
import { SwUpdate } from "@angular/service-worker";
import { Observable } from "rxjs";

export const versionServiceStub = {
  get versionState() {
    // return observable
    return new Observable<VersionState>();
  },
  async ready() {
    await Promise.resolve();
  }
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
