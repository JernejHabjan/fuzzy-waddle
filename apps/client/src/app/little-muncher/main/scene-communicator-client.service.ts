import { Injectable } from '@angular/core';
import { CommunicatorService } from '../game/communicator.service';
import { HttpClient } from '@angular/common/http';
import { AuthenticatedSocketService } from '../../data-access/chat/authenticated-socket.service';

@Injectable({
  providedIn: 'root'
})
export class SceneCommunicatorClientService {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly communicator: CommunicatorService,
    private readonly authenticatedSocketService: AuthenticatedSocketService
  ) {}

  startListeningToEvents(gameInstanceId: string) {
    this.communicator.startCommunication(gameInstanceId, this.authenticatedSocketService.socket);
  }

  stopListeningToEvents() {
    this.communicator.stopCommunication();
  }
}
