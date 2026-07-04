import { inject, Injectable } from "@angular/core";
import { AuthenticatedSocketService } from "../../data-access/chat/authenticated-socket.service";
import { type SceneCommunicatorClientServiceInterface } from "./scene-communicator-client.service.interface";
import { ProbableWaffleCommunicatorService } from "./probable-waffle-communicator.service";
import { Subscription } from "rxjs";
import type { ProbableWaffleCommunicators } from "./probable-waffle.communicators";
import type { GameInstanceId } from "@fuzzy-waddle/api-interfaces";

@Injectable({
  providedIn: "root"
})
export class SceneCommunicatorClientService implements SceneCommunicatorClientServiceInterface {
  private readonly communicator = inject(ProbableWaffleCommunicatorService);
  private readonly authenticatedSocketService = inject(AuthenticatedSocketService);
  async createCommunicators(gameInstanceId: GameInstanceId, useServerTransport: boolean = true): Promise<ProbableWaffleCommunicators> {
    const socket = useServerTransport ? await this.authenticatedSocketService.getSocket() : undefined;
    this.communicator.startCommunication(gameInstanceId, socket);
    return this.communicatorObservables;
  }

  get communicatorObservables(): ProbableWaffleCommunicators {
    if (
      !this.communicator.gameInstanceMetadataChanged ||
      !this.communicator.gameModeChanged ||
      !this.communicator.playerChanged ||
      !this.communicator.spectatorChanged ||
      !this.communicator.gameStateChanged
    )
      return null;
    return {
      gameInstanceObservable: this.communicator.gameInstanceMetadataChanged!.on,
      gameModeObservable: this.communicator.gameModeChanged!.on,
      playerObservable: this.communicator.playerChanged!.on,
      spectatorObservable: this.communicator.spectatorChanged!.on,
      gameStateObservable: this.communicator.gameStateChanged!.on
    };
  }

  async destroyCommunicators(
    gameInstanceId: GameInstanceId,
    subscriptions: Subscription[],
    useServerTransport: boolean = true
  ): Promise<void> {
    const socket = useServerTransport ? await this.authenticatedSocketService.getSocket() : undefined;
    this.communicator.stopCommunication(gameInstanceId, socket);
    subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
