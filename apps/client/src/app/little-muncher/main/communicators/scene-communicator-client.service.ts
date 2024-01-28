import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { SceneCommunicatorClientServiceInterface } from "./scene-communicator-client.service.interface";
import { LittleMuncherCommunicatorService } from "./little-muncher-communicator.service";
import { AuthenticatedSocketService } from "../../../data-access/chat/authenticated-socket.service";

@Injectable({
  providedIn: "root"
})
export class SceneCommunicatorClientService implements SceneCommunicatorClientServiceInterface {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly communicator: LittleMuncherCommunicatorService,
    private readonly authenticatedSocketService: AuthenticatedSocketService
  ) {}

  startListeningToEvents(gameInstanceId: string) {
    this.communicator.startCommunication(gameInstanceId, this.authenticatedSocketService.socket);
  }

  stopListeningToEvents() {
    this.communicator.stopCommunication();
  }
}
