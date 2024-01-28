import { TestBed } from "@angular/core/testing";

import { DbAccessTestService } from "./db-access-test.service";
import { DataAccessService } from "../data-access.service";
import { dataAccessServiceStub } from "../data-access.service.spec";

export const dbAccessTestServiceStub = {
  get(): void {
    console.log("test");
  },
  add(): void {
    console.log("test");
  },
  async getStorageEntry(): Promise<void> {
    console.log("test");
  }
};
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
