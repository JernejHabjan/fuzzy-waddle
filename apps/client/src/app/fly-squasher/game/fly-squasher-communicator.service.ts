import { Injectable, type OnDestroy } from "@angular/core";
import { TwoWayCommunicator } from "../../shared/game/communicators/two-way-communicator";
import {
  type FlySquasherCommunicatorScoreEvent,
  FlySquasherGatewayEvent,
  type LittleMuncherCommunicatorType
} from "@fuzzy-waddle/api-interfaces";
import type { CommunicatorService } from "../../shared/game/communicators/CommunicatorService";

export const flySquasherCommunicatorServiceStub = {
  startCommunication: () => {},
  stopCommunication: () => {}
};

@Injectable({
  providedIn: "root"
})
export class FlySquasherCommunicatorService implements CommunicatorService, OnDestroy {
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
