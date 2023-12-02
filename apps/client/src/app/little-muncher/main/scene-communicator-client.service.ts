import { Injectable } from "@angular/core";
import { LittleMuncherCommunicatorService } from "../game/little-muncher-communicator.service";
import { HttpClient } from "@angular/common/http";
import { AuthenticatedSocketService } from "../../data-access/chat/authenticated-socket.service";
import { SceneCommunicatorClientServiceInterface } from "./scene-communicator-client.service.interface";

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
