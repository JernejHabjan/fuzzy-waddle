import { inject, Injectable } from "@angular/core";
import { AuthenticatedSocketService } from "../../data-access/chat/authenticated-socket.service";
import { SceneCommunicatorClientServiceInterface } from "./scene-communicator-client.service.interface";
import { ProbableWaffleCommunicatorService } from "./probable-waffle-communicator.service";
import { Observable, Subscription } from "rxjs";
import {
  ProbableWaffleGameInstanceMetadataChangeEvent,
  ProbableWaffleGameModeDataChangeEvent,
  ProbableWaffleGameStateDataChangeEvent,
  ProbableWafflePlayerDataChangeEvent,
  ProbableWaffleSpectatorDataChangeEvent
} from "@fuzzy-waddle/api-interfaces";

export type ProbableWaffleCommunicators = {
  gameInstanceObservable: Observable<ProbableWaffleGameInstanceMetadataChangeEvent>;
  gameModeObservable: Observable<ProbableWaffleGameModeDataChangeEvent>;
  playerObservable: Observable<ProbableWafflePlayerDataChangeEvent>;
  spectatorObservable: Observable<ProbableWaffleSpectatorDataChangeEvent>;
  gameStateObservable: Observable<ProbableWaffleGameStateDataChangeEvent>;
} | null;

@Injectable({
  providedIn: "root"
})
export class SceneCommunicatorClientService implements SceneCommunicatorClientServiceInterface {
  private readonly communicator = inject(ProbableWaffleCommunicatorService);
  private readonly authenticatedSocketService = inject(AuthenticatedSocketService);
  async createCommunicators(gameInstanceId: string): Promise<ProbableWaffleCommunicators> {
    const socket = await this.authenticatedSocketService.getSocket();
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

  async destroyCommunicators(gameInstanceId: string, subscriptions: Subscription[]): Promise<void> {
    const socket = await this.authenticatedSocketService.getSocket();
    this.communicator.stopCommunication(gameInstanceId, socket);
    subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
