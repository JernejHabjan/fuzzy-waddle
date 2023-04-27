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
  keyboard: TwoWayCommunicator<CommunicatorKeyEvent> = new TwoWayCommunicator<CommunicatorKeyEvent>();
  score: TwoWayCommunicator<CommunicatorScoreEvent> = new TwoWayCommunicator<CommunicatorScoreEvent>();
  pause: TwoWayCommunicator<CommunicatorPauseEvent> = new TwoWayCommunicator<CommunicatorPauseEvent>();

  startServerCommunication(socket: Socket) {
    this.keyboard.listenToCommunication({
      eventName: LittleMuncherGatewayEvent.LittleMuncherMove,
      socket
    });
    this.pause.listenToCommunication({
      eventName: LittleMuncherGatewayEvent.LittleMuncherPause,
      socket
    });
    this.score.listenToCommunication({
      eventName: LittleMuncherGatewayEvent.LittleMuncherScore,
      socket
    });
  }

  stopCommunication() {
    this.keyboard.destroy();
    this.score.destroy();
  }

  ngOnDestroy(): void {
    this.stopCommunication();
  }
}
