import { TestBed } from "@angular/core/testing";
import { ProbableWaffleCommunicatorServiceInterface } from "./probable-waffle-communicator.service.interface";
import { ProbableWaffleCommunicatorService } from "./probable-waffle-communicator.service";

export const probableWaffleCommunicatorServiceStub = {
  startCommunication: () => {},
  stopCommunication: () => {}
} satisfies ProbableWaffleCommunicatorServiceInterface;
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
