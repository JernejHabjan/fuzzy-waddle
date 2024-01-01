import { inject, Injectable } from "@angular/core";
import { AuthenticatedSocketService } from "../../data-access/chat/authenticated-socket.service";
import { SceneCommunicatorClientServiceInterface } from "./scene-communicator-client.service.interface";
import { ProbableWaffleCommunicatorService } from "./probable-waffle-communicator.service";

@Injectable({
  providedIn: "root"
})
export class SceneCommunicatorClientService implements SceneCommunicatorClientServiceInterface {
  private readonly communicator = inject(ProbableWaffleCommunicatorService);
  private readonly authenticatedSocketService = inject(AuthenticatedSocketService);
  createCommunicators(gameInstanceId: string) {
    if (!this.authenticatedSocketService.socket) return;
    this.communicator.startCommunication(gameInstanceId, this.authenticatedSocketService.socket);
  }

  destroyCommunicators(gameInstanceId: string) {
    if (!this.authenticatedSocketService.socket) return;
    this.communicator.stopCommunication(gameInstanceId, this.authenticatedSocketService.socket);
  }
}
