import GameProbableWaffleScene from "../../world/scenes/GameProbableWaffleScene";
import { ProbableWafflePlayerType } from "@fuzzy-waddle/api-interfaces";
import { PlayerAiController } from "./player-ai-controller";
import { Subscription } from "rxjs";

export class AiPlayerHandler {
  private aiPlayerControllers: PlayerAiController[] = [];
  private onShutdownSubscription: Subscription;
  constructor(private readonly scene: GameProbableWaffleScene) {
    this.onShutdownSubscription = scene.onShutdown.subscribe(() => this.clearControllers());
    scene.onDestroy.subscribe(() => this.onShutdownSubscription.unsubscribe());
    this.createAiPlayerControllersForAiPlayers();
  }

  createAiPlayerControllersForAiPlayers() {
    // this only runs on host machine
    if (!this.scene.isHost) return;

    const aiPlayers = this.scene.players.filter(
      (player) => player.playerController.data.playerDefinition!.playerType === ProbableWafflePlayerType.AI
    );

    aiPlayers.forEach((player) => {
      const aiPlayerController = new PlayerAiController(this.scene, player);
      this.aiPlayerControllers.push(aiPlayerController);
    });
  }

  private clearControllers() {
    this.aiPlayerControllers = [];
  }

  getAiPlayerController(playerNumber: number) {
    return this.aiPlayerControllers.find((controller) => controller.player.playerNumber === playerNumber);
  }
}
