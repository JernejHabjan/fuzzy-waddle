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

  it("does not create a minimap signal communicator without a multiplayer socket", () => {
    service.startCommunication("test-game" as never);

    expect(service.minimapSignal).toBeUndefined();

    service.stopCommunication("test-game" as never);
  });
});
