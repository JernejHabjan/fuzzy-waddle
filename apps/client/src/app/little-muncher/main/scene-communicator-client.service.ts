import { Injectable } from '@angular/core';
import { SceneCommunicatorService } from '../game/scene-communicator.service';
import { Subscription } from 'rxjs';
import { Socket } from 'ngx-socket-io';
import { HttpClient } from '@angular/common/http';
import { AuthenticatedSocketService } from '../../data-access/chat/authenticated-socket.service';
import { GatewayEvent, LittleMuncherSceneCommunicatorKeyEvent } from '@fuzzy-waddle/api-interfaces';

@Injectable({
  providedIn: 'root'
})
export class SceneCommunicatorClientService {
  private keyboardSubscription!: Subscription;
  private authenticatedSocket!: Socket;

  constructor(
    private readonly httpClient: HttpClient,
    private readonly authenticatedSocketService: AuthenticatedSocketService
  ) {
    this.authenticatedSocket = this.authenticatedSocketService.createAuthSocket(); // todo this needs to be constructed only when the user is authenticated
  }

  startListeningToEvents() {
    SceneCommunicatorService.setup();

    // listen from Phaser game
    this.keyboardSubscription = SceneCommunicatorService.keyboardSubjectPhaserToServer.subscribe((event) => {
      this.authenticatedSocket.emit(GatewayEvent.LittleMuncherMove, event);
    });

    // listen from server
    this.authenticatedSocket.on(GatewayEvent.LittleMuncherMove, (event: LittleMuncherSceneCommunicatorKeyEvent) => {
      // broadcast to Phaser game
      SceneCommunicatorService.keyboardSubjectServerToPhaser.next(event);
    });
  }

  stopListeningToEvents() {
    this.keyboardSubscription.unsubscribe();
    this.authenticatedSocket.removeListener(GatewayEvent.LittleMuncherMove);
  }
}
