import { Injectable, type OnDestroy } from "@angular/core";
import { Socket } from "ngx-socket-io";
import {
  type LittleMuncherCommunicatorClimbingEvent,
  type LittleMuncherCommunicatorPauseEvent,
  type LittleMuncherCommunicatorResetEvent,
  type LittleMuncherCommunicatorScoreEvent,
  type LittleMuncherCommunicatorType,
  LittleMuncherGatewayEvent,
  LittleMuncherPosition
} from "@fuzzy-waddle/api-interfaces";
import { TwoWayCommunicator } from "../../../shared/game/communicators/two-way-communicator";
import type { CommunicatorService } from "../../../shared/game/communicators/CommunicatorService";

@Injectable({
  providedIn: "root"
})
export class LittleMuncherCommunicatorService implements CommunicatorService, OnDestroy {
  move?: TwoWayCommunicator<LittleMuncherPosition, LittleMuncherCommunicatorType>;
  score?: TwoWayCommunicator<LittleMuncherCommunicatorScoreEvent, LittleMuncherCommunicatorType>;
  timeClimbing?: TwoWayCommunicator<LittleMuncherCommunicatorClimbingEvent, LittleMuncherCommunicatorType>;
  pause?: TwoWayCommunicator<LittleMuncherCommunicatorPauseEvent, LittleMuncherCommunicatorType>;
  reset?: TwoWayCommunicator<LittleMuncherCommunicatorResetEvent, LittleMuncherCommunicatorType>;

  startCommunication(gameInstanceId: string, socket?: Socket) {
    this.move = new TwoWayCommunicator<LittleMuncherPosition, LittleMuncherCommunicatorType>(
      LittleMuncherGatewayEvent.LittleMuncherAction,
      "move",
      gameInstanceId,
      socket
    );
    this.score = new TwoWayCommunicator<LittleMuncherCommunicatorScoreEvent, LittleMuncherCommunicatorType>(
      LittleMuncherGatewayEvent.LittleMuncherAction,
      "score",
      gameInstanceId,
      socket
    );
    this.timeClimbing = new TwoWayCommunicator<LittleMuncherCommunicatorClimbingEvent, LittleMuncherCommunicatorType>(
      LittleMuncherGatewayEvent.LittleMuncherAction,
      "timeClimbing",
      gameInstanceId,
      socket
    );
    this.pause = new TwoWayCommunicator<LittleMuncherCommunicatorPauseEvent, LittleMuncherCommunicatorType>(
      LittleMuncherGatewayEvent.LittleMuncherAction,
      "pause",
      gameInstanceId,
      socket
    );
    this.reset = new TwoWayCommunicator<LittleMuncherCommunicatorResetEvent, LittleMuncherCommunicatorType>(
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
