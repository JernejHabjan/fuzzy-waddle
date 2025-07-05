import { TestBed } from "@angular/core/testing";

import { AuthService } from "./auth.service";
import { DataAccessService } from "../data-access/data-access.service";
import { dataAccessServiceStub } from "../data-access/data-access.service.stub";

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
