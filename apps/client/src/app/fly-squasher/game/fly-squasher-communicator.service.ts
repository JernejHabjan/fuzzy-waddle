import { Injectable, OnDestroy } from "@angular/core";
import { TwoWayCommunicator } from "../../shared/game/communicators/two-way-communicator";
import { FlySquasherCommunicatorScoreEvent, FlySquasherGatewayEvent } from "@fuzzy-waddle/api-interfaces";

export const flySquasherCommunicatorServiceStub = {
  startCommunication: () => {},
  stopCommunication: () => {}
};

@Injectable({
  providedIn: "root"
})
export class FlySquasherCommunicatorService implements OnDestroy {
  score?: TwoWayCommunicator<FlySquasherCommunicatorScoreEvent>;

  startCommunication() {
    this.score = new TwoWayCommunicator<FlySquasherCommunicatorScoreEvent>(
      FlySquasherGatewayEvent.FlySquasherAction,
      "score"
    );
  }

  stopCommunication() {
    this.score?.destroy();
  }

  ngOnDestroy(): void {
    this.stopCommunication();
  }
}
