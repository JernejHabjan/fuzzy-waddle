import { inject, Injectable } from "@angular/core";
import { type SceneCommunicatorClientServiceInterface } from "./scene-communicator-client.service.interface";
import { LittleMuncherCommunicatorService } from "./little-muncher-communicator.service";
import { AuthenticatedSocketService } from "@fuzzy-waddle/platform-chat/client/data-access/authenticated-socket.service";
import type { GameInstanceId } from "@fuzzy-waddle/platform-game-sessions";

@Injectable({
  providedIn: "root"
})
export class SceneCommunicatorClientService implements SceneCommunicatorClientServiceInterface {
  private readonly communicator = inject(LittleMuncherCommunicatorService);
  private readonly authenticatedSocketService = inject(AuthenticatedSocketService);

  async startListeningToEvents(gameInstanceId: GameInstanceId): Promise<void> {
    const socket = await this.authenticatedSocketService.getSocket();
    this.communicator.startCommunication(gameInstanceId, socket);
  }

  stopListeningToEvents() {
    this.communicator.stopCommunication();
  }
}
