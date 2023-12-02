import { Injectable, OnDestroy } from "@angular/core";
import { TwoWayCommunicator } from "../../shared/game/communicators/two-way-communicator";
import { Socket } from "ngx-socket-io";
import {
  LittleMuncherCommunicatorClimbingEvent,
  LittleMuncherCommunicatorPauseEvent,
  LittleMuncherCommunicatorResetEvent,
  LittleMuncherCommunicatorScoreEvent,
  LittleMuncherGatewayEvent,
  LittleMuncherPosition
} from "@fuzzy-waddle/api-interfaces";

@Injectable({
  providedIn: "root"
})
export class LittleMuncherCommunicatorService implements OnDestroy {
  move?: TwoWayCommunicator<LittleMuncherPosition>;
  score?: TwoWayCommunicator<LittleMuncherCommunicatorScoreEvent>;
  timeClimbing?: TwoWayCommunicator<LittleMuncherCommunicatorClimbingEvent>;
  pause?: TwoWayCommunicator<LittleMuncherCommunicatorPauseEvent>;
  reset?: TwoWayCommunicator<LittleMuncherCommunicatorResetEvent>;

  startCommunication(gameInstanceId: string, socket?: Socket) {
    this.move = new TwoWayCommunicator<LittleMuncherPosition>(
      LittleMuncherGatewayEvent.LittleMuncherAction,
      "move",
      gameInstanceId,
      socket
    );
    this.score = new TwoWayCommunicator<LittleMuncherCommunicatorScoreEvent>(
      LittleMuncherGatewayEvent.LittleMuncherAction,
      "score",
      gameInstanceId,
      socket
    );
    this.timeClimbing = new TwoWayCommunicator<LittleMuncherCommunicatorClimbingEvent>(
      LittleMuncherGatewayEvent.LittleMuncherAction,
      "timeClimbing",
      gameInstanceId,
      socket
    );
    this.pause = new TwoWayCommunicator<LittleMuncherCommunicatorPauseEvent>(
      LittleMuncherGatewayEvent.LittleMuncherAction,
      "pause",
      gameInstanceId,
      socket
    );
    this.reset = new TwoWayCommunicator<LittleMuncherCommunicatorResetEvent>(
      LittleMuncherGatewayEvent.LittleMuncherAction,
      "reset",
      gameInstanceId,
      socket
    );
  }

  stopCommunication() {
    this.move?.destroy();
    this.score?.destroy();
    this.pause?.destroy();
  }

  ngOnDestroy(): void {
    this.stopCommunication();
  }
}
