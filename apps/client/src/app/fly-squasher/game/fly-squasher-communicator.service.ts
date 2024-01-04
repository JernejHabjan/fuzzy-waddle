import { Injectable, OnDestroy } from "@angular/core";
import { TwoWayCommunicator } from "../../shared/game/communicators/two-way-communicator";
import {
  FlySquasherCommunicatorScoreEvent,
  FlySquasherGatewayEvent,
  LittleMuncherCommunicatorType
} from "@fuzzy-waddle/api-interfaces";

export const flySquasherCommunicatorServiceStub = {
  startCommunication: () => {},
  stopCommunication: () => {}
};

@Injectable({
  providedIn: "root"
})
export class FlySquasherCommunicatorService implements OnDestroy {
  score?: TwoWayCommunicator<FlySquasherCommunicatorScoreEvent, LittleMuncherCommunicatorType>;

  startCommunication() {
    this.score = new TwoWayCommunicator<FlySquasherCommunicatorScoreEvent, LittleMuncherCommunicatorType>(
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
