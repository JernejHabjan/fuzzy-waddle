import { Component, inject } from "@angular/core";
import { Router } from "@angular/router";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";

@Component({
  selector: "probable-waffle-trigger",
  templateUrl: "./trigger.component.html",
  styleUrls: ["./trigger.component.scss"]
})
export class TriggerComponent {
  protected readonly gameInstanceClientService = inject(GameInstanceClientService);
  private readonly router = inject(Router);

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

  protected async leaveClick() {
    await this.router.navigate(["probable-waffle"]);
  }
}
