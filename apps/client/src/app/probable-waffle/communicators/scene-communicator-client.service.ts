import { inject, Injectable } from "@angular/core";
import { AuthenticatedSocketService } from "../../data-access/chat/authenticated-socket.service";
import { SceneCommunicatorClientServiceInterface } from "./scene-communicator-client.service.interface";
import { ProbableWaffleCommunicatorService } from "./probable-waffle-communicator.service";
import { Observable, Subscription } from "rxjs";
import {
  ProbableWaffleGameInstanceMetadataChangeEvent,
  ProbableWaffleGameModeDataChangeEvent,
  ProbableWafflePlayerDataChangeEvent,
  ProbableWaffleSpectatorDataChangeEvent
} from "@fuzzy-waddle/api-interfaces";

export type ProbableWaffleCommunicators = {
  gameInstanceObservable: Observable<ProbableWaffleGameInstanceMetadataChangeEvent>;
  gameModeObservable: Observable<ProbableWaffleGameModeDataChangeEvent>;
  playerObservable: Observable<ProbableWafflePlayerDataChangeEvent>;
  spectatorObservable: Observable<ProbableWaffleSpectatorDataChangeEvent>;
} | null;

@Injectable({
  providedIn: "root"
})
export class SceneCommunicatorClientService implements SceneCommunicatorClientServiceInterface {
  private readonly communicator = inject(ProbableWaffleCommunicatorService);
  private readonly authenticatedSocketService = inject(AuthenticatedSocketService);
  createCommunicators(gameInstanceId: string): ProbableWaffleCommunicators {
    if (!this.authenticatedSocketService.socket) return null;
    this.communicator.startCommunication(gameInstanceId, this.authenticatedSocketService.socket);
    return this.communicatorObservables;
  }

  get communicatorObservables(): ProbableWaffleCommunicators {
    return {
      gameInstanceObservable: this.communicator.gameInstanceMetadataChanged!.on,
      gameModeObservable: this.communicator.gameModeChanged!.on,
      playerObservable: this.communicator.playerChanged!.on,
      spectatorObservable: this.communicator.spectatorChanged!.on
    };
  }

  destroyCommunicators(gameInstanceId: string, subscriptions: Subscription[]) {
    if (!this.authenticatedSocketService.socket) return;
    this.communicator.stopCommunication(gameInstanceId, this.authenticatedSocketService.socket);
    subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
