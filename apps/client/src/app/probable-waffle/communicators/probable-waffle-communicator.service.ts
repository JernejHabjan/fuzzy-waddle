import { Injectable, OnDestroy } from "@angular/core";
import { ProbableWaffleCommunicatorScoreEvent, ProbableWaffleGatewayEvent } from "@fuzzy-waddle/api-interfaces";
import { TwoWayCommunicator } from "../../shared/game/communicators/two-way-communicator";
import { Socket } from "ngx-socket-io";

export const probableWaffleCommunicatorServiceStub = {
  startCommunication: () => {},
  stopCommunication: () => {}
};

@Injectable({
  providedIn: "root"
})
export class ProbableWaffleCommunicatorService implements OnDestroy {
  score?: TwoWayCommunicator<ProbableWaffleCommunicatorScoreEvent>;

  startCommunication(gameInstanceId: string, socket?: Socket) {
    this.score = new TwoWayCommunicator<ProbableWaffleCommunicatorScoreEvent>(
      ProbableWaffleGatewayEvent.ProbableWaffleAction,
      "score",
      gameInstanceId,
      socket
    );
  }

  stopCommunication() {
    this.score?.destroy();
  }

  ngOnDestroy(): void {
    this.stopCommunication();
  }
}
