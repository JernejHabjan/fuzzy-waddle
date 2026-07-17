import { TestBed } from "@angular/core/testing";

import { AuthService } from "./auth.service";
import { DataAccessService } from "@fuzzy-waddle/platform-identity/client/data-access.service";
import { dataAccessServiceStub } from "@fuzzy-waddle/platform-identity/client/data-access.service.stub";

describe("AuthService", () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: DataAccessService, useValue: dataAccessServiceStub }] });
    service = TestBed.inject(AuthService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
