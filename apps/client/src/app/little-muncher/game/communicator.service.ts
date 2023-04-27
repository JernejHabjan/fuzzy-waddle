import { Injectable, OnDestroy } from '@angular/core';
import { TwoWayCommunicator } from '../../shared/game/communicators/two-way-communicator';
import { Socket } from 'ngx-socket-io';
import {
  LittleMuncherCommunicatorKeyEvent,
  LittleMuncherCommunicatorScoreEvent,
  LittleMuncherGatewayEvent
} from '@fuzzy-waddle/api-interfaces';

@Injectable({
  providedIn: 'root'
})
export class CommunicatorService implements OnDestroy {
  keyboard: TwoWayCommunicator<LittleMuncherCommunicatorKeyEvent> =
    new TwoWayCommunicator<LittleMuncherCommunicatorKeyEvent>();
  score: TwoWayCommunicator<LittleMuncherCommunicatorScoreEvent> =
    new TwoWayCommunicator<LittleMuncherCommunicatorScoreEvent>();

  startServerCommunication(socket: Socket) {
    this.keyboard.communicateWithServer(socket, LittleMuncherGatewayEvent.LittleMuncherMove);
  }

  stopCommunication() {
    this.keyboard.destroy();
    this.score.destroy();
  }

  ngOnDestroy(): void {
    this.stopCommunication();
  }
}
