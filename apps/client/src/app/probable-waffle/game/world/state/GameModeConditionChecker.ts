import {
  getBaseGameDataFromScene,
  getGameModeFromScene,
  getPlayersFromScene,
  isPlayerHostInScene
} from "../../../../shared/game/phaser/scene/base.scene";
import {
  GameSessionState,
  GameResultStatus,
  type LoseConditions,
  ProbableWaffleGameInstanceType,
  ProbableWaffleGameMode,
  ProbableWafflePlayer,
  ProbableWafflePlayerType,
  type TieConditions,
  type WinConditions
} from "@fuzzy-waddle/api-interfaces";
import { type ProbableWaffleGameData } from "../../core/probable-waffle-game-data";
import { ScenePlayerHelpers } from "../../data/scene-player-helpers";
import { getCurrentPlayerNumber } from "../../data/scene-data";
import { getActorComponent } from "../../data/actor-component";
import { ConstructionSiteComponent } from "../../entity/components/construction/construction-site-component";
import { filter, type Subscription } from "rxjs";
import type { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import type EndGameDialog from "../scenes/hud-scenes/EndGameDialog";
import { getSceneService, getSceneSystem } from "../services/scene-component-helpers";
import { AiPlayerHandler } from "../../player/ai-controller/ai-player-handler";
import HudProbableWaffle from "../scenes/hud-scenes/HudProbableWaffle";
import { SceneDialogHelper } from "../scenes/scene-dialog-helper";
import { ScoreTracker } from "./ScoreTracker";
import { SimulationTickService } from "../services/simulation-tick.service";
import { CancelableSimDelay } from "../services/simulation-time";

export class GameModeConditionChecker {
  private loseConditions: LoseConditions;
  private winConditions: WinConditions;
  private tieConditions: TieConditions;
  private actorsByPlayer?: Map<number, Phaser.GameObjects.GameObject[]>;
  private currentPlayerNumber!: number;
  private players!: ProbableWafflePlayer[];
  private currentPlayer!: ProbableWafflePlayer;
  private selfQuitSubscription?: Subscription;
  private stopped: boolean = false;
  private readonly checkIntervalTicks = 20; // 1 second at the fixed 20 Hz simulation rate.
  private readonly surrenderCheckIntervalTicks = 40; // 2 seconds at the fixed 20 Hz simulation rate.
  private lastSurrenderCheckTick = 0;
  private currentDelay?: CancelableSimDelay;
  private simulationTickSub?: Subscription;

  constructor(private readonly scene: ProbableWaffleScene) {
    const gameModeData = getGameModeFromScene<ProbableWaffleGameMode>(scene).data;
    this.loseConditions = gameModeData.loseConditions;
    this.winConditions = gameModeData.winConditions;
    this.tieConditions = gameModeData.tieConditions;

    this.currentDelay = new CancelableSimDelay(this.scene, 1000, () => this.startChecking());
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.listenToPlayerQuit();
  }

  private startChecking() {
    this.simulationTickSub = getSceneService(this.scene, SimulationTickService)?.tick$.subscribe((tick) => {
      if (tick % this.checkIntervalTicks === 0) {
        this.check(tick);
      }
    });
  }

  private check(tick: number) {
    if (!this.scene.scene || !this.scene.scene.isActive()) return;
    if (this.stopped) return;
    this.prepareData();
    this.checkAiSurrender(tick);
    if (this.checkWinConditions()) {
      this.winGame();
      return;
    }
    if (this.checkLoseConditions()) {
      this.loseGame();
      return;
    }
    if (this.checkTieConditions()) {
      this.tieGame();
      return;
    }
  }

  private prepareData() {
    this.currentPlayerNumber = getCurrentPlayerNumber(this.scene)!;
    this.players = getPlayersFromScene<ProbableWafflePlayer>(this.scene);
    this.currentPlayer = this.players.find((player) => player.playerNumber === this.currentPlayerNumber)!;
    this.actorsByPlayer = ScenePlayerHelpers.getActorsByPlayer(this.scene).actorsByPlayer;

    this.runChecksForSelfAndAiPlayers();
  }

  private listenToPlayerQuit() {
    this.selfQuitSubscription = this.scene.communicator.allScenes
      .pipe(filter((scene) => scene.name === "quit"))
      .subscribe(() => {
        if (this.stopped) return;
        this.selfQuit();
      });
  }

  private runChecksForSelfAndAiPlayers() {
    const isHost = isPlayerHostInScene(this.scene, this.currentPlayer);
    const aiPlayers = this.players.filter(
      (player) => player.playerController.data.playerDefinition?.playerType === ProbableWafflePlayerType.AI
    );

    const playersToCheck = isHost ? [this.currentPlayer, ...aiPlayers] : [this.currentPlayer];
    playersToCheck.forEach((player) => {
      if (player.playerController.data.leftOrKilled) return;

      // check if player has no actors left, if yes, mark as left or killed
      const actors = this.actorsByPlayer?.get(player.playerNumber!) || [];
      if (actors.length === 0) {
        player.playerController.data.leftOrKilled = true;
        console.log(`Player ${player.playerNumber} has no actors left, marked as killed.`);
      }
    });
  }

  private checkAiSurrender(tick: number) {
    if (tick - this.lastSurrenderCheckTick < this.surrenderCheckIntervalTicks) return;
    this.lastSurrenderCheckTick = tick;

    // Only check surrender in single-player mode (InstantGame or Skirmish)
    const baseGameData = getBaseGameDataFromScene<ProbableWaffleGameData>(this.scene);
    const gameType = baseGameData.gameInstance.gameInstanceMetadata.data.type;
    if (
      gameType !== ProbableWaffleGameInstanceType.InstantGame &&
      gameType !== ProbableWaffleGameInstanceType.Skirmish
    ) {
      return;
    }

    // Check if there are any other human players
    const humanPlayers = this.players.filter(
      (player) =>
        player.playerController.data.playerDefinition?.playerType === ProbableWafflePlayerType.Human &&
        !player.playerController.data.leftOrKilled
    );
    if (humanPlayers.length > 1) {
      return; // Multiple human players, don't offer surrender
    }

    // Check AI players for surrender requests
    const isHost = isPlayerHostInScene(this.scene, this.currentPlayer);
    if (!isHost) return;

    const aiPlayers = this.players.filter(
      (player) =>
        player.playerController.data.playerDefinition?.playerType === ProbableWafflePlayerType.AI &&
        !player.playerController.data.leftOrKilled
    );

    aiPlayers.forEach((aiPlayer) => {
      // Get AI controller to check surrender state using getSceneSystem
      const aiPlayerHandler = getSceneSystem(this.scene, AiPlayerHandler);
      if (!aiPlayerHandler) return;

      const aiController = aiPlayerHandler.getAiPlayerController(aiPlayer.playerNumber!);
      if (!aiController) return;

      const blackboard = aiController.blackboard;
      if (blackboard.wantsToSurrender) {
        // Show surrender dialog
        // Note: We keep wantsToSurrender flag set to prevent offering again
        // The flag will be reset when the dialog is accepted/rejected
        this.showSurrenderDialog(aiPlayer, aiController);
      }
    });
  }

  private showSurrenderDialog(aiPlayer: ProbableWafflePlayer, aiController: any) {
    // Find the HUD scene
    const hudScene = this.scene.scene.get("HudProbableWaffle") as HudProbableWaffle;
    if (!hudScene || !hudScene.surrenderDialog) return;

    // Don't show if dialog is already visible
    if (hudScene.surrenderDialog.visible) return;

    hudScene.surrenderDialog.showSurrenderRequest(
      aiPlayer,
      (player: ProbableWafflePlayer) => {
        // Reset surrender flag before handling
        aiController.blackboard.wantsToSurrender = false;
        this.handleSurrenderAccepted(player);
      },
      (player: ProbableWafflePlayer) => {
        // Reset surrender flag before handling
        aiController.blackboard.wantsToSurrender = false;
        this.handleSurrenderRejected(player);
      }
    );
  }

  private handleSurrenderAccepted(player: ProbableWafflePlayer) {
    console.log(`Player ${player.playerNumber} surrender accepted - eliminating player`);
    // Mark player as eliminated
    player.playerController.data.leftOrKilled = true;

    // Destroy all units/buildings owned by this player
    const actors = this.actorsByPlayer?.get(player.playerNumber!) || [];
    actors.forEach((actor) => {
      if (actor && actor.active) {
        actor.destroy();
      }
    });
  }

  private handleSurrenderRejected(player: ProbableWafflePlayer) {
    console.log(`Player ${player.playerNumber} surrender rejected - continuing game`);
    // Mark surrender as rejected so AI won't offer again
    const aiPlayerHandler = getSceneSystem(this.scene, AiPlayerHandler);
    if (aiPlayerHandler) {
      const aiController = aiPlayerHandler.getAiPlayerController(player.playerNumber!);
      if (aiController) {
        aiController.blackboard.surrenderRejected = true;
      }
    }
  }

  private checkWinConditions(): boolean {
    const players = this.players;
    const currentPlayerNumber = this.currentPlayerNumber;
    const currentPlayer = this.currentPlayer;
    if (this.winConditions.noEnemyPlayersLeft) {
      // Check if there are no enemy players left
      const enemyPlayers = players.filter(
        (player) =>
          player.playerNumber !== currentPlayer.playerNumber &&
          player.playerController.data.playerDefinition!.team !==
            currentPlayer.playerController.data.playerDefinition!.team &&
          !player.playerController.data.leftOrKilled
      );
      if (enemyPlayers.length === 0) {
        console.log("No enemy players left, win condition met.");
        return true; // No enemy players left, consider it a win
      }
    }
    if (this.winConditions.timeReachedInMinutes) {
      const elapsedTime = this.getElapsedGameMinutes();
      if (elapsedTime >= this.winConditions.timeReachedInMinutes) {
        return true; // Time limit reached, consider it a win
      }
    }
    if (this.winConditions.kills) {
      // Check if current player has reached the required number of kills
      const actorKilledEvents = currentPlayer.playerState.data.summary.filter((s) => s.type === "unit_killed");
      const totalKills = actorKilledEvents.reduce((acc, event) => acc + (event.data?.kills || 0), 0);
      if (totalKills >= this.winConditions.kills) {
        console.log("Required number of kills reached, win condition met.");
        return true; // Required number of kills reached
      }
    }
    if (this.winConditions.resources) {
      // Check if current player has collected the required resources
      const playerResources = currentPlayer.playerState.data.resources;
      for (const [resourceType, requiredAmount] of this.winConditions.resources.entries()) {
        const currentAmount = playerResources[resourceType] || 0;
        if (currentAmount < requiredAmount) {
          return false; // Not enough resources
        }
      }
      console.log("All required resources collected, win condition met.");
      return true; // All required resources collected
    }
    if (this.winConditions.actorsTotal) {
      // Check if current player has the required number of actors
      const actors = this.actorsByPlayer?.get(currentPlayerNumber) || [];
      if (actors.length >= this.winConditions.actorsTotal) {
        console.log("Required number of actors reached, win condition met.");
        return true; // Required number of actors reached
      }
    }
    if (this.winConditions.actorsOfType) {
      // Check if current player has the required number of specific actors
      const actors = this.actorsByPlayer?.get(currentPlayerNumber) || [];
      for (const [actorType, requiredAmount] of this.winConditions.actorsOfType.entries()) {
        const count = actors.filter((actor) => actor.name === actorType).length;
        if (count < requiredAmount) {
          return false; // Not enough actors of the required type
        }
      }
      console.log("All required actors of specific types collected, win condition met.");
      return true; // All required actors of specific types collected
    }
    return false;
  }

  private checkLoseConditions(): boolean {
    const currentPlayerNumber = this.currentPlayerNumber;
    if (this.loseConditions.allActorsMustBeEliminated) {
      // Check if current player has no owning actors left
      if (this.currentPlayer.playerController.data.leftOrKilled) {
        console.log("All actors eliminated, lose condition met.");
        return true; // No actors left, consider it a loss
      }
    }
    if (this.loseConditions.allBuildingsMustBeEliminated) {
      const actors = this.actorsByPlayer?.get(currentPlayerNumber) || [];
      // Check if current player has no owning buildings left (actors with constructionSite component)
      const buildings = actors.filter((actor) => getActorComponent(actor, ConstructionSiteComponent));
      if (buildings.length === 0) {
        console.log("All buildings eliminated, lose condition met.");
        this.currentPlayer.playerController.data.leftOrKilled = true;
        return true; // No buildings left, consider it a loss
      }
    }
    return false;
  }

  private checkTieConditions(): boolean {
    if (this.tieConditions.maximumTimeLimitInMinutes) {
      const elapsedTime = this.getElapsedGameMinutes();
      if (elapsedTime >= this.tieConditions.maximumTimeLimitInMinutes) {
        console.log("Maximum time limit reached, tie condition met.");
        return true; // Time limit reached, consider it a tie
      }
    }
    return false;
  }

  private getElapsedGameMinutes(): number {
    const currentTick = getSceneService(this.scene, SimulationTickService)?.currentTick ?? 0;
    return currentTick / 20 / 60;
  }

  private selfQuit() {
    this.currentPlayer.playerController.data.leftOrKilled = true;
    console.log(`Player ${this.currentPlayer.playerNumber} has quit the game.`);

    // Update ScoreTracker
    const scoreTracker = getSceneSystem(this.scene, ScoreTracker);
    if (scoreTracker) {
      scoreTracker.setPlayerResult(this.currentPlayerNumber, GameResultStatus.Quit);
      scoreTracker.finalizeScores();
      scoreTracker.stop();
    }

    this.navigateToScoreScreen();
    this.stop();
  }

  private winGame() {
    // Update ScoreTracker with results
    const scoreTracker = getSceneSystem(this.scene, ScoreTracker);
    if (scoreTracker) {
      scoreTracker.setPlayerResult(this.currentPlayerNumber, GameResultStatus.Win);

      // Set enemy results
      this.players.forEach((player) => {
        if (player.playerNumber !== this.currentPlayerNumber) {
          scoreTracker.setPlayerResult(player.playerNumber!, GameResultStatus.Loss);
        }
      });

      scoreTracker.finalizeScores();
      scoreTracker.stop();
    }

    this.createEndGameLayer("You have won the game!", () => {
      this.navigateToScoreScreen();
    });
    this.stop();
  }

  private loseGame() {
    // Update ScoreTracker with results
    const scoreTracker = getSceneSystem(this.scene, ScoreTracker);
    if (scoreTracker) {
      scoreTracker.setPlayerResult(this.currentPlayerNumber, GameResultStatus.Loss);

      // Set enemy results (they won)
      this.players.forEach((player) => {
        if (player.playerNumber !== this.currentPlayerNumber && !player.playerController.data.leftOrKilled) {
          scoreTracker.setPlayerResult(player.playerNumber!, GameResultStatus.Win);
        }
      });

      scoreTracker.finalizeScores();
      scoreTracker.stop();
    }

    this.createEndGameLayer("You have lost the game.", () => {
      this.navigateToScoreScreen();
    });
    this.stop();
  }

  private tieGame() {
    // Update ScoreTracker with tie results for all players
    const scoreTracker = getSceneSystem(this.scene, ScoreTracker);
    if (scoreTracker) {
      this.players.forEach((player) => {
        scoreTracker.setPlayerResult(player.playerNumber!, GameResultStatus.Tie);
      });

      scoreTracker.finalizeScores();
      scoreTracker.stop();
    }

    this.createEndGameLayer("The game ended in a tie!", () => {
      this.navigateToScoreScreen();
    });
    this.stop();
  }

  private navigateToScoreScreen() {
    const baseGameData = getBaseGameDataFromScene<ProbableWaffleGameData>(this.scene);
    const communicator = baseGameData.communicator;
    // todo rather than this, change the player state session state to "to score screen" because only 1 player quits
    communicator.gameInstanceMetadataChanged?.send({
      property: "sessionState",
      gameInstanceId: baseGameData.gameInstance.gameInstanceMetadata.data.gameInstanceId!,
      data: { sessionState: GameSessionState.ToScoreScreen },
      emitterUserId: baseGameData.user.userId
    });
  }

  private createEndGameLayer = (message: string, callback: () => void) => {
    const layer = SceneDialogHelper.showDialog<EndGameDialog>(this.scene, "EndGameDialog");
    setTimeout(() => {
      layer.setMessage(message);
      layer.setCallback(callback);
    }, 100);
  };

  private stop() {
    this.stopped = true;
  }

  private destroy() {
    this.simulationTickSub?.unsubscribe();
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.destroy);
    this.selfQuitSubscription?.unsubscribe();
    this.currentDelay?.remove();
  }
}
