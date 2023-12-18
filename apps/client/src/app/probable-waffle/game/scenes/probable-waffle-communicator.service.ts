import { Injectable, OnDestroy } from "@angular/core";
import { ProbableWaffleCommunicatorScoreEvent, ProbableWaffleGatewayEvent } from "@fuzzy-waddle/api-interfaces";
import { TwoWayCommunicator } from "../../../shared/game/communicators/two-way-communicator";

export const probableWaffleCommunicatorServiceStub = {
  startCommunication: () => {},
  stopCommunication: () => {}
};

@Injectable({
  providedIn: "root"
})
export class ProbableWaffleCommunicatorService implements OnDestroy {
  score?: TwoWayCommunicator<ProbableWaffleCommunicatorScoreEvent>;

  startCommunication() {
    this.score = new TwoWayCommunicator<ProbableWaffleCommunicatorScoreEvent>(
      ProbableWaffleGatewayEvent.ProbableWaffleAction,
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
