import GameProbableWaffleScene from "../../world/scenes/GameProbableWaffleScene";
import { type PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import { ProbableWafflePlayerType } from "@fuzzy-waddle/probable-waffle-protocol";
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
    if (this.aiPlayerControllers.length > 0) return;

    const aiPlayers = this.scene.players.filter((player) => {
      const definition = player.playerController.data.playerDefinition;
      return (
        definition?.playerType === ProbableWafflePlayerType.AI &&
        (definition.campaignController ?? "full-ai") === "full-ai"
      );
    });

    aiPlayers.forEach((player) => {
      const aiPlayerController = new PlayerAiController(this.scene, player);
      aiPlayerController.setEnabled(player.playerController.data.playerDefinition?.campaignAiEnabled ?? true);
      this.aiPlayerControllers.push(aiPlayerController);
    });
  }

  private clearControllers() {
    this.aiPlayerControllers = [];
  }

  getAiPlayerController(playerNumber: PlayerNumber) {
    return this.aiPlayerControllers.find((controller) => controller.player.playerNumber === playerNumber);
  }

  /** Documents the set player enabled member and its declared contract at this boundary. */
  setPlayerEnabled(playerNumber: PlayerNumber, enabled: boolean): boolean {
    const controller = this.getAiPlayerController(playerNumber);
    if (!controller) return false;
    controller.setEnabled(enabled);
    return true;
  }
}
