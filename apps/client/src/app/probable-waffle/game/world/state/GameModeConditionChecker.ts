import {
  getBaseGameDataFromScene,
  getGameModeFromScene,
  getPlayersFromScene,
  isPlayerHostInScene
} from "../../../../shared/game/phaser/scene/base.scene";
import {
  GameSessionState,
  type LoseConditions,
  ProbableWaffleGameMode,
  ProbableWaffleGameInstanceType,
  ProbableWafflePlayer,
  ProbableWafflePlayerType,
  type TieConditions,
  type WinConditions
} from "@fuzzy-waddle/api-interfaces";
import { throttle } from "../../library/throttle";
import { type ProbableWaffleGameData } from "../../core/probable-waffle-game-data";
import { ScenePlayerHelpers } from "../../data/scene-player-helpers";
import { getCurrentPlayerNumber } from "../../data/scene-data";
import { getActorComponent } from "../../data/actor-component";
import { ConstructionSiteComponent } from "../../entity/components/construction/construction-site-component";
import { getSceneSystem } from "../services/scene-component-helpers";
import { AiPlayerHandler } from "../../player/ai-controller/ai-player-handler";

export class GameModeConditionChecker {
  private loseConditions: LoseConditions;
  private winConditions: WinConditions;
  private tieConditions: TieConditions;
  private actorsByPlayer?: Map<number, Phaser.GameObjects.GameObject[]>;
  private currentPlayerNumber!: number;
  private players!: ProbableWafflePlayer[];
  private currentPlayer!: ProbableWafflePlayer;
  private surrenderCheckInterval = 2000; // Check every 2 seconds
  private lastSurrenderCheckTime = 0;

  constructor(private readonly scene: Phaser.Scene) {
    const gameModeData = getGameModeFromScene<ProbableWaffleGameMode>(scene).data;
    this.loseConditions = gameModeData.loseConditions;
    this.winConditions = gameModeData.winConditions;
    this.tieConditions = gameModeData.tieConditions;

    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.throttleCheck, this);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  private throttleCheck = throttle(this.check.bind(this), 1000);

  private check() {
    if (!this.scene.scene || !this.scene.scene.isActive()) return;
    this.prepareData();
    this.checkAiSurrender();
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

  private checkAiSurrender() {
    const now = Date.now();
    if (now - this.lastSurrenderCheckTime < this.surrenderCheckInterval) return;
    this.lastSurrenderCheckTime = now;

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

      const aiController = aiPlayerHandler.getAiPlayerController(aiPlayer.playerNumber);
      if (!aiController) return;

      const blackboard = aiController.blackboard;
      if (blackboard.wantsToSurrender) {
        // Show surrender dialog
        this.showSurrenderDialog(aiPlayer);
        // Reset surrender flag to prevent repeated dialogs
        blackboard.wantsToSurrender = false;
      }
    });
  }

  private showSurrenderDialog(aiPlayer: ProbableWafflePlayer) {
    // Find the HUD scene
    const hudScene = this.scene.scene.get("HudProbableWaffle") as any;
    if (!hudScene || !hudScene.surrenderDialog) return;

    // Don't show if dialog is already visible
    if (hudScene.surrenderDialog.visible) return;

    hudScene.surrenderDialog.showSurrenderRequest(
      aiPlayer,
      (player: ProbableWafflePlayer) => this.handleSurrenderAccepted(player),
      (player: ProbableWafflePlayer) => this.handleSurrenderRejected(player)
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
      const aiController = aiPlayerHandler.getAiPlayerController(player.playerNumber);
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
      const elapsedTime = this.scene.game.loop.time / 1000 / 60; // Convert to minutes
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
      const elapsedTime = this.scene.game.loop.time / 1000 / 60; // Convert to minutes
      if (elapsedTime >= this.tieConditions.maximumTimeLimitInMinutes) {
        console.log("Maximum time limit reached, tie condition met.");
        return true; // Time limit reached, consider it a tie
      }
    }
    return false;
  }

  private winGame() {
    // Implement your win game logic here
    console.log("You win!");
    this.tempQuit();
  }

  private loseGame() {
    // Implement your lose game logic here
    console.log("You lose!");
    this.tempQuit();
  }

  private tieGame() {
    // Implement your tie game logic here
    console.log("It's a tie!");
    this.tempQuit();
  }

  private tempQuit() {
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

  private destroy() {
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.throttleCheck);
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.destroy);
  }
}
