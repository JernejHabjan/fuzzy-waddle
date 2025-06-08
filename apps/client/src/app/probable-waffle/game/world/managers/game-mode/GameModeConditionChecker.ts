import { getBaseGameDataFromScene, getGameModeFromScene } from "../../../../../shared/game/phaser/scene/base.scene";
import {
  GameSessionState,
  LoseConditions,
  ProbableWaffleGameMode,
  TieConditions,
  WinConditions
} from "@fuzzy-waddle/api-interfaces";
import { throttle } from "../../../library/throttle";
import { ProbableWaffleGameData } from "../../../scenes/probable-waffle-game-data";

export class GameModeConditionChecker {
  private loseConditions: LoseConditions;
  private winConditions: WinConditions;
  private tieConditions: TieConditions;

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

  private checkWinConditions(): boolean {
    if (this.winConditions.noEnemyPlayersLeft) {
      // Check if there are no enemy players left // todo
    }
    if (this.winConditions.timeReachedInMinutes) {
      const elapsedTime = this.scene.game.loop.time / 1000 / 60; // Convert to minutes
      if (elapsedTime >= this.winConditions.timeReachedInMinutes) {
        return true; // Time limit reached, consider it a win
      }
    }
    if (this.winConditions.kills) {
      // Check if current player has reached the required number of kills // todo
    }
    if (this.winConditions.resources) {
      // Check if current player has collected the required resources // todo
    }
    if (this.winConditions.actorsTotal) {
      // Check if current player has the required number of actors // todo
    }
    if (this.winConditions.actorsOfType) {
      // Check if current player has the required number of specific actors // todo
    }
    return false;
  }

  private checkLoseConditions(): boolean {
    if (this.loseConditions.allActorsMustBeEliminated) {
      // Check if current player has no owning actors left // todo
    }
    if (this.loseConditions.allBuildingsMustBeEliminated) {
      // Check if current player has no owning buildings left (actors with constructionSite component) // todo
    }
    return false;
  }

  private checkTieConditions(): boolean {
    if (this.tieConditions.maximumTimeLimitInMinutes) {
      const elapsedTime = this.scene.game.loop.time / 1000 / 60; // Convert to minutes
      if (elapsedTime >= this.tieConditions.maximumTimeLimitInMinutes) {
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
