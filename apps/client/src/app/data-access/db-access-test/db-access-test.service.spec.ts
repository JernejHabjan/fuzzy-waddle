import { TestBed } from "@angular/core/testing";

import { DbAccessTestService } from "./db-access-test.service";
import { DataAccessService } from "../data-access.service";
import { dataAccessServiceStub } from "../data-access.service.stub";

describe("DbAccessTest", () => {
  let service: DbAccessTestService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: DataAccessService, useValue: dataAccessServiceStub }] });
    service = TestBed.inject(DbAccessTestService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
