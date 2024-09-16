import { filter, Subscription } from "rxjs";
import GameProbableWaffleScene from "../scenes/GameProbableWaffleScene";

export class RestartGame {
  private restartGameSubscription: Subscription;

  constructor(private scene: GameProbableWaffleScene) {
    this.restartGameSubscription = scene.communicator.allScenes
      .pipe(filter((scene) => scene.name === "restart-game"))
      .subscribe(() => this.onRestartGame());
    scene.onShutdown.subscribe(() => this.destroy());
  }

  private destroy() {
    this.restartGameSubscription.unsubscribe();
  }

  private onRestartGame() {
    this.scene.scene.restart();
  }
}
