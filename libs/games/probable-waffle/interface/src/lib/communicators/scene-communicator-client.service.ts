import { inject, Injectable } from "@angular/core";
import { AuthenticatedSocketService } from "@fuzzy-waddle/platform-chat/client/data-access/authenticated-socket.service";
import { type SceneCommunicatorClientServiceInterface } from "./scene-communicator-client.service.interface";
import { ProbableWaffleCommunicatorService } from "./probable-waffle-communicator.service";
import { Subscription } from "rxjs";
import type { ProbableWaffleCommunicators } from "./probable-waffle.communicators";
import type { GameInstanceId } from "@fuzzy-waddle/platform-game-sessions";

@Injectable({
  providedIn: "root"
})
export class SceneCommunicatorClientService implements SceneCommunicatorClientServiceInterface {
  private operationGeneration = 0;
  private desiredInstanceId?: GameInstanceId;
  private readonly communicator = inject(ProbableWaffleCommunicatorService);
  private readonly authenticatedSocketService = inject(AuthenticatedSocketService);
  async createCommunicators(
    gameInstanceId: GameInstanceId,
    useServerTransport: boolean = true
  ): Promise<ProbableWaffleCommunicators> {
    const generation = ++this.operationGeneration;
    this.desiredInstanceId = gameInstanceId;
    const socket = useServerTransport ? await this.authenticatedSocketService.getSocket() : undefined;
    if (generation !== this.operationGeneration) throw new Error("communicator_creation_superseded");
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
    // Detach the old local consumers before an awaited socket lookup can overlap the next scene.
    subscriptions.forEach((subscription) => subscription.unsubscribe());
    if (this.desiredInstanceId !== gameInstanceId) return;
    const generation = ++this.operationGeneration;
    const socket = useServerTransport ? await this.authenticatedSocketService.getSocket() : undefined;
    if (generation !== this.operationGeneration) return;
    this.communicator.stopCommunication(gameInstanceId, socket);
    this.desiredInstanceId = undefined;
  }
}
