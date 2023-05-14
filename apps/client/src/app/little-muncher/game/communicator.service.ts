import { Injectable, OnDestroy } from '@angular/core';
import { TwoWayCommunicator } from '../../shared/game/communicators/two-way-communicator';
import { Socket } from 'ngx-socket-io';
import {
  CommunicatorClimbingEvent,
  CommunicatorPauseEvent,
  CommunicatorScoreEvent,
  LittleMuncherGatewayEvent,
  LittleMuncherPosition
} from '@fuzzy-waddle/api-interfaces';

@Injectable({
  providedIn: 'root'
})
export class CommunicatorService implements OnDestroy {
  key?: TwoWayCommunicator<LittleMuncherPosition>;
  score?: TwoWayCommunicator<CommunicatorScoreEvent>;
  timeClimbing?: TwoWayCommunicator<CommunicatorClimbingEvent>;
  pause?: TwoWayCommunicator<CommunicatorPauseEvent>;

  startCommunication(gameInstanceId: string, socket?: Socket) {
    this.key = new TwoWayCommunicator<LittleMuncherPosition>(
      LittleMuncherGatewayEvent.LittleMuncherAction,
      'key',
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
  }

  stopCommunication() {
    this.key?.destroy();
    this.score?.destroy();
    this.pause?.destroy();
  }

  ngOnDestroy(): void {
    this.stopCommunication();
  }
}
