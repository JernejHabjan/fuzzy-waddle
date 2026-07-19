import { TestBed } from "@angular/core/testing";
import { LittleMuncherCommunicatorService } from "./little-muncher-communicator.service";

describe("LittleMuncherCommunicatorService", () => {
  it("stops communication when Angular destroys the service", () => {
    TestBed.configureTestingModule({ providers: [LittleMuncherCommunicatorService] });
    const service = TestBed.inject(LittleMuncherCommunicatorService);
    const stopCommunication = jest.spyOn(service, "stopCommunication");

    service.ngOnDestroy();

    expect(stopCommunication).toHaveBeenCalledTimes(1);
  });
});
