import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { SceneCommunicatorClientServiceInterface } from "./scene-communicator-client.service.interface";
import { LittleMuncherCommunicatorService } from "./little-muncher-communicator.service";
import { AuthenticatedSocketService } from "../../../data-access/chat/authenticated-socket.service";

@Injectable({
  providedIn: "root"
})
export class SceneCommunicatorClientService implements SceneCommunicatorClientServiceInterface {
  private readonly communicator = inject(LittleMuncherCommunicatorService);
  private readonly authenticatedSocketService = inject(AuthenticatedSocketService);

  async startListeningToEvents(gameInstanceId: string): Promise<void> {
    const socket = await this.authenticatedSocketService.getSocket();
    this.communicator.startCommunication(gameInstanceId, socket);
  }

  stopListeningToEvents() {
    this.communicator.stopCommunication();
  }
}
