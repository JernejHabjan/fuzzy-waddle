import { TestBed } from "@angular/core/testing";
import { ProbableWaffleCommunicatorService } from "./probable-waffle-communicator.service";

describe("ProbableWaffleCommunicatorService", () => {
  let service: ProbableWaffleCommunicatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProbableWaffleCommunicatorService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
