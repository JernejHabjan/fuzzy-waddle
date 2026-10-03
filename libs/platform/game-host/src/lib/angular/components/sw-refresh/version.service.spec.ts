import { TestBed } from "@angular/core/testing";

import { VersionService } from "./version.service";
import { SwUpdate } from "@angular/service-worker";

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
