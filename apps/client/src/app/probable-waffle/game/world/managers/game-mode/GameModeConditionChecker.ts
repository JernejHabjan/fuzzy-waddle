import {
  getBaseGameDataFromScene,
  getGameModeFromScene,
  getPlayersFromScene
} from "../../../../../shared/game/phaser/scene/base.scene";
import {
  GameSessionState,
  LoseConditions,
  ProbableWaffleGameMode,
  ProbableWafflePlayer,
  TieConditions,
  WinConditions
} from "@fuzzy-waddle/api-interfaces";
import { throttle } from "../../../library/throttle";
import { ProbableWaffleGameData } from "../../../scenes/probable-waffle-game-data";
import { ScenePlayerHelpers } from "../../../data/scene-player-helpers";
import { getCurrentPlayerNumber } from "../../../data/scene-data";
import { getActorComponent } from "../../../data/actor-component";
import { ConstructionSiteComponent } from "../../../entity/building/construction/construction-site-component";

export class GameModeConditionChecker {
  private loseConditions: LoseConditions;
  private winConditions: WinConditions;
  private tieConditions: TieConditions;
  private actorsByPlayer?: Map<number, Phaser.GameObjects.GameObject[]>;

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
    const shouldGatherActorsFromScene =
      this.winConditions.noEnemyPlayersLeft ||
      this.winConditions.actorsTotal ||
      this.winConditions.actorsOfType ||
      this.loseConditions.allActorsMustBeEliminated ||
      this.loseConditions.allBuildingsMustBeEliminated;
    if (shouldGatherActorsFromScene) {
      const { actorsByPlayer } = ScenePlayerHelpers.getActorsByPlayer(this.scene);
      this.actorsByPlayer = actorsByPlayer;
    }
  }

  private checkWinConditions(): boolean {
    if (this.winConditions.noEnemyPlayersLeft) {
      // Check if there are no enemy players left
      const currentPlayerNumber = getCurrentPlayerNumber(this.scene);
      const players = getPlayersFromScene<ProbableWafflePlayer>(this.scene);
      const currentPlayer = players.find((player) => player.playerNumber === currentPlayerNumber)!;
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
      const currentPlayerNumber = getCurrentPlayerNumber(this.scene);
      const players = getPlayersFromScene<ProbableWafflePlayer>(this.scene);
      const currentPlayer = players.find((player) => player.playerNumber === currentPlayerNumber)!;
      const actorKilledEvents = currentPlayer.playerState.data.summary.filter((s) => s.type === "unit_killed");
      const totalKills = actorKilledEvents.reduce((acc, event) => acc + (event.data?.kills || 0), 0);
      if (totalKills >= this.winConditions.kills) {
        console.log("Required number of kills reached, win condition met.");
        return true; // Required number of kills reached
      }
    }
    if (this.winConditions.resources) {
      // Check if current player has collected the required resources
      const currentPlayerNumber = getCurrentPlayerNumber(this.scene);
      const players = getPlayersFromScene<ProbableWafflePlayer>(this.scene);
      const currentPlayer = players.find((player) => player.playerNumber === currentPlayerNumber)!;
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
      const currentPlayerNumber = getCurrentPlayerNumber(this.scene)!;
      const actors = this.actorsByPlayer?.get(currentPlayerNumber) || [];
      if (actors.length >= this.winConditions.actorsTotal) {
        console.log("Required number of actors reached, win condition met.");
        return true; // Required number of actors reached
      }
    }
    if (this.winConditions.actorsOfType) {
      // Check if current player has the required number of specific actors
      const currentPlayerNumber = getCurrentPlayerNumber(this.scene)!;
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
    if (this.loseConditions.allActorsMustBeEliminated) {
      // Check if current player has no owning actors left
      const currentPlayerNumber = getCurrentPlayerNumber(this.scene)!;
      const actors = this.actorsByPlayer?.get(currentPlayerNumber) || [];
      if (actors.length === 0) {
        console.log("All actors eliminated, lose condition met.");
        return true; // No actors left, consider it a loss
      }
    }
    if (this.loseConditions.allBuildingsMustBeEliminated) {
      // Check if current player has no owning buildings left (actors with constructionSite component)
      const currentPlayerNumber = getCurrentPlayerNumber(this.scene)!;
      const actors = this.actorsByPlayer?.get(currentPlayerNumber) || [];
      const buildings = actors.filter((actor) => getActorComponent(actor, ConstructionSiteComponent));
      if (buildings.length === 0) {
        console.log("All buildings eliminated, lose condition met.");
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
