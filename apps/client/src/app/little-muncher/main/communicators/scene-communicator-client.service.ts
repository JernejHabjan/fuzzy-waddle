import { inject, Injectable } from "@angular/core";
import { type SceneCommunicatorClientServiceInterface } from "./scene-communicator-client.service.interface";
import { LittleMuncherCommunicatorService } from "./little-muncher-communicator.service";
import { AuthenticatedSocketService } from "../../../data-access/chat/authenticated-socket.service";
import type { GameInstanceId } from "@fuzzy-waddle/api-interfaces";
import { HighScoreService } from "../../high-score/high-score.service";
import { Subscription } from "rxjs";
import { GameInstanceClientService } from "./game-instance-client.service";

@Injectable({
  providedIn: "root"
})
export class SceneCommunicatorClientService implements SceneCommunicatorClientServiceInterface {
  private readonly communicator = inject(LittleMuncherCommunicatorService);
  private readonly authenticatedSocketService = inject(AuthenticatedSocketService);
  private readonly highScoreService = inject(HighScoreService);
  private readonly gameInstanceClientService = inject(GameInstanceClientService);

  private scoreSubscription?: Subscription;

  async startListeningToEvents(gameInstanceId: GameInstanceId): Promise<void> {
    const socket = await this.authenticatedSocketService.getSocket();
    this.communicator.startCommunication(gameInstanceId, socket);
    this.handleScore();
  }

  private handleScore() {
    this.scoreSubscription = this.communicator.score?.on.subscribe(async (scoreEvent) => {
      const gameInstance = this.gameInstanceClientService.gameInstance;
      if (!gameInstance) return;

      const hill = gameInstance.gameMode?.data.hill;
      if (!hill) return;

      await this.highScoreService.postScore(scoreEvent.score, hill);
    });
  }

  stopListeningToEvents() {
    this.communicator.stopCommunication();
    this.scoreSubscription?.unsubscribe();
  }
}
