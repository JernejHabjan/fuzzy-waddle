import { Injectable, inject } from "@angular/core";
import { FlySquasherCommunicatorService } from "../game/fly-squasher-communicator.service";
import { HighScoreService } from "../high-score/high-score.service";
import { Subscription } from "rxjs";

@Injectable({
  providedIn: "root"
})
export class SceneCommunicatorClientService {
  private readonly highScoreService = inject(HighScoreService);
  private readonly communicatorService = inject(FlySquasherCommunicatorService);

  private scoreSubscription?: Subscription;

  startCommunication() {
    this.communicatorService.startCommunication();
    this.handleScore();
  }

  private handleScore() {
    this.scoreSubscription = this.communicatorService.score!.on.subscribe(async (score) => {
      await this.highScoreService.postScore(score.score, score.level);
    });
  }

  stopCommunication() {
    this.communicatorService.stopCommunication();
    this.scoreSubscription?.unsubscribe();
  }
}
