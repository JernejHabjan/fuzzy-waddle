import { Injectable } from '@angular/core';
import { CommunicatorService } from '../game/communicator.service';
import { Socket } from 'ngx-socket-io';
import { HttpClient } from '@angular/common/http';
import { AuthenticatedSocketService } from '../../data-access/chat/authenticated-socket.service';

@Injectable({
  providedIn: 'root'
})
export class SceneCommunicatorClientService {
  private authenticatedSocket?: Socket;

  constructor(
    private readonly httpClient: HttpClient,
    private readonly communicator: CommunicatorService,
    private readonly authenticatedSocketService: AuthenticatedSocketService
  ) {
    this.authenticatedSocket = this.authenticatedSocketService.createAuthSocket(); // todo this needs to be constructed only when the user is authenticated
  }

  startListeningToEvents() {
    const socket = this.authenticatedSocket;
    if (!socket) return;

    this.communicator.startServerCommunication(socket);
  }

  stopListeningToEvents() {
    this.communicator.stopCommunication();
  }
}
