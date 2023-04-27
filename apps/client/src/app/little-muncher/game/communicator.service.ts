import { Injectable, OnDestroy } from '@angular/core';
import { TwoWayCommunicator } from '../../shared/game/communicators/two-way-communicator';
import { Socket } from 'ngx-socket-io';
import {
  CommunicatorKeyEvent,
  CommunicatorPauseEvent,
  CommunicatorScoreEvent,
  LittleMuncherGatewayEvent
} from '@fuzzy-waddle/api-interfaces';

@Injectable({
  providedIn: 'root'
})
export class CommunicatorService implements OnDestroy {
  key?: TwoWayCommunicator<CommunicatorKeyEvent>;
  score?: TwoWayCommunicator<CommunicatorScoreEvent>;
  pause?: TwoWayCommunicator<CommunicatorPauseEvent>;

  startServerCommunication(socket: Socket) {
    this.key = new TwoWayCommunicator<CommunicatorKeyEvent>(
      LittleMuncherGatewayEvent.LittleMuncherAction,
      'key',
      socket
    );
    this.score = new TwoWayCommunicator<CommunicatorScoreEvent>(
      LittleMuncherGatewayEvent.LittleMuncherAction,
      'score',
      socket
    );
    this.pause = new TwoWayCommunicator<CommunicatorPauseEvent>(
      LittleMuncherGatewayEvent.LittleMuncherAction,
      'pause',
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
