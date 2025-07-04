import { Component, inject } from "@angular/core";
import { Router } from "@angular/router";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { AuthService } from "../../../../auth/auth.service";
import { ToastService } from "../../../../shared/services/toast.service";
import { faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
import {
  PositionPlayerDefinition,
  ProbableWaffleGameInstanceType,
  ProbableWafflePlayerDataChangeEventProperty,
  ProbableWafflePlayerType
} from "@fuzzy-waddle/api-interfaces";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";

@Component({
  selector: "probable-waffle-trigger",
  templateUrl: "./trigger.component.html",
  imports: [FaIconComponent],
  styleUrls: ["./trigger.component.scss"]
})
export class TriggerComponent {
  protected readonly gameInstanceClientService = inject(GameInstanceClientService);
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  protected readonly faTimes = faTimes;
  protected readonly faCheck = faCheck;

  protected get mapSelected(): boolean {
    return !!this.gameInstanceClientService.gameInstance?.gameMode?.data.map;
  }

  /**
   * at least two players selected and at least two different teams
   */
  protected get atLeastTwoPlayersAndDifferentTeamsSelected(): boolean {
    const players = this.gameInstanceClientService.gameInstance!.players;
    const playerPositions = players.map((player) => player.playerController.data.playerDefinition!);
    const selectedPlayers = playerPositions.filter((startPosition) => startPosition.player.joined);
    const selectedEmptyTeams = playerPositions.filter(
      (startPosition) => !startPosition.team && startPosition.player.joined
    );
    const selectedTeams = playerPositions.filter((startPosition) => !startPosition.team && startPosition.player.joined);
    const selectedTeamsSet = new Set(selectedTeams.map((startPosition) => startPosition.team));
    return selectedPlayers.length >= 2 && selectedEmptyTeams.length + selectedTeamsSet.size >= 2;
  }

  protected async start() {
    await this.gameInstanceClientService.startGame();
  }

  protected get isHost(): boolean {
    return this.gameInstanceClientService.gameInstance?.isHost(this.authService.userId) ?? false;
  }

  protected get isSelfHosted(): boolean {
    return (
      this.gameInstanceClientService.gameInstance?.gameInstanceMetadata?.data.type ===
      ProbableWaffleGameInstanceType.SelfHosted
    );
  }

  protected get allPlayersReady(): boolean {
    const players = this.gameInstanceClientService.gameInstance?.players || [];
    // Consider AI players always ready
    const humanPlayers = players.filter(
      (player) => player.playerController.data.playerDefinition?.playerType === ProbableWafflePlayerType.Human
    );

    // Check if all human players are ready
    return (
      humanPlayers.length > 0 &&
      humanPlayers.every((player) => player.playerController.data.playerDefinition?.player.ready === true)
    );
  }

  protected get isCurrentPlayerReady(): boolean {
    const currentPlayer = this.gameInstanceClientService.gameInstance?.players.find(
      (p) => p.playerNumber === this.gameInstanceClientService.currentPlayerNumber
    );
    return currentPlayer?.playerController.data.playerDefinition?.player.ready === true;
  }

  protected async toggleReady(): Promise<void> {
    const currentPlayer = this.gameInstanceClientService.gameInstance?.players.find(
      (p) => p.playerNumber === this.gameInstanceClientService.currentPlayerNumber
    );

    if (currentPlayer) {
      const currentReady = currentPlayer.playerController.data.playerDefinition?.player.ready === true;
      const newReady = !currentReady;

      await this.gameInstanceClientService.playerChanged(
        "playerController.data.playerDefinition.player.ready" as ProbableWafflePlayerDataChangeEventProperty,
        {
          playerNumber: currentPlayer.playerNumber,
          playerControllerData: {
            playerDefinition: { player: { ready: newReady } } as PositionPlayerDefinition
          }
        }
      );
    }
  }

  /**
   * Handles the Start Game button click by checking conditions and displaying
   * appropriate messages or starting the game if all conditions are met
   */
  protected async handleStartGame() {
    if (!this.isHost) {
      this.toastService.showWarning("Access Denied", "You must be the host to start the game.");
      return;
    }

    // Set host as ready when they attempt to start the game
    const hostPlayer = this.gameInstanceClientService.gameInstance?.players.find(
      (p) => this.gameInstanceClientService.gameInstance?.isHost(p.playerController.data.userId) ?? false
    );

    if (hostPlayer && !hostPlayer.playerController.data.playerDefinition?.player.ready) {
      await this.gameInstanceClientService.playerChanged(
        "playerController.data.playerDefinition.player.ready" as ProbableWafflePlayerDataChangeEventProperty,
        {
          playerNumber: hostPlayer.playerNumber,
          playerControllerData: {
            playerDefinition: { player: { ready: true } } as PositionPlayerDefinition
          }
        }
      );
    }

    if (!this.mapSelected) {
      this.toastService.showWarning("Map Required", "Please select a map before starting the game.");
      return;
    }

    if (!this.atLeastTwoPlayersAndDifferentTeamsSelected) {
      this.toastService.showWarning(
        "Players Required",
        "You need at least two players on different teams to start the game."
      );
      return;
    }

    if (this.isSelfHosted && !this.allPlayersReady) {
      this.toastService.showWarning(
        "Players Not Ready",
        "Not all players are ready. Wait for all players to be ready or start anyway."
      );
      return;
    }

    // All conditions are met, start the game
    await this.start();
  }
}
