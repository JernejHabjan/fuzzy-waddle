import { inject, Injectable } from "@angular/core";
import { AuthenticatedSocketService } from "../../data-access/chat/authenticated-socket.service";
import { SceneCommunicatorClientServiceInterface } from "./scene-communicator-client.service.interface";
import { ProbableWaffleCommunicatorService } from "./probable-waffle-communicator.service";
import { AuthService } from "../../auth/auth.service";
import { ServerHealthService } from "../../shared/services/server-health.service";

@Injectable({
  providedIn: "root"
})
export class SceneCommunicatorClientService implements SceneCommunicatorClientServiceInterface {
  private readonly communicator = inject(ProbableWaffleCommunicatorService);
  private readonly authenticatedSocketService = inject(AuthenticatedSocketService);
  private readonly authService = inject(AuthService);
  private readonly serverHealthService = inject(ServerHealthService);
  startListeningToEvents(gameInstanceId: string) {
    if (
      !this.authenticatedSocketService.socket ||
      !this.authService.isAuthenticated ||
      !this.serverHealthService.serverAvailable
    )
      return;
    this.communicator.startCommunication(gameInstanceId, this.authenticatedSocketService.socket);
  }

  stopListeningToEvents(gameInstanceId: string) {
    if (
      !this.authenticatedSocketService.socket ||
      !this.authService.isAuthenticated ||
      !this.serverHealthService.serverAvailable
    )
      return;
    this.communicator.stopCommunication(gameInstanceId, this.authenticatedSocketService.socket);
  }
}
