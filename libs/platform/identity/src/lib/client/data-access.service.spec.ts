import { TestBed } from "@angular/core/testing";

import { DataAccessService } from "./data-access.service";
import { dataAccessServiceStub } from "./data-access.service.stub";

describe("DataAccess", () => {
  let service: DataAccessService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: DataAccessService, useValue: dataAccessServiceStub }] });
    service = TestBed.inject(DataAccessService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
