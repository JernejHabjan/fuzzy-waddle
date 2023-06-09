import { Injectable, OnDestroy } from '@angular/core';
import { TwoWayCommunicator } from '../../shared/game/communicators/two-way-communicator';
import { Socket } from 'ngx-socket-io';
import {
  CommunicatorClimbingEvent,
  CommunicatorPauseEvent,
  CommunicatorResetEvent,
  CommunicatorScoreEvent,
  LittleMuncherGatewayEvent,
  LittleMuncherPosition
} from '@fuzzy-waddle/api-interfaces';

@Injectable({
  providedIn: 'root'
})
export class CommunicatorService implements OnDestroy {
  move?: TwoWayCommunicator<LittleMuncherPosition>;
  score?: TwoWayCommunicator<CommunicatorScoreEvent>;
  timeClimbing?: TwoWayCommunicator<CommunicatorClimbingEvent>;
  pause?: TwoWayCommunicator<CommunicatorPauseEvent>;
  reset?: TwoWayCommunicator<CommunicatorResetEvent>;

  startCommunication(gameInstanceId: string, socket?: Socket) {
    this.move = new TwoWayCommunicator<LittleMuncherPosition>(
      LittleMuncherGatewayEvent.LittleMuncherAction,
      'move',
      gameInstanceId,
      socket
    );
    this.score = new TwoWayCommunicator<CommunicatorScoreEvent>(
      LittleMuncherGatewayEvent.LittleMuncherAction,
      'score',
      gameInstanceId,
      socket
    );
    this.timeClimbing = new TwoWayCommunicator<CommunicatorClimbingEvent>(
      LittleMuncherGatewayEvent.LittleMuncherAction,
      'timeClimbing',
      gameInstanceId,
      socket
    );
    this.pause = new TwoWayCommunicator<CommunicatorPauseEvent>(
      LittleMuncherGatewayEvent.LittleMuncherAction,
      'pause',
      gameInstanceId,
      socket
    );
    this.reset = new TwoWayCommunicator<CommunicatorResetEvent>(
      LittleMuncherGatewayEvent.LittleMuncherAction,
      'reset',
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
