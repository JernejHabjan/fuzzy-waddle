import { TestBed } from "@angular/core/testing";
import { SceneCommunicatorClientService } from "./scene-communicator-client.service";
import { HighScoreService } from "../high-score/high-score.service";
import { highScoreServiceStub } from "../high-score/high-score.service.spec";

export const sceneCommunicatorClientServiceStub = {
  startCommunication: () => {},
  stopCommunication: () => {}
};
describe("SceneCommunicatorClientService", () => {
  let service: SceneCommunicatorClientService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: HighScoreService, useValue: highScoreServiceStub }]
    });
    service = TestBed.inject(SceneCommunicatorClientService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
