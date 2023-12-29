import { Component, EventEmitter, inject, Output } from "@angular/core";
import { Router } from "@angular/router";
import { MapPlayerDefinitionsService } from "../map-player-definitions.service";

@Component({
  selector: "probable-waffle-trigger",
  templateUrl: "./trigger.component.html",
  styleUrls: ["./trigger.component.scss"]
})
export class TriggerComponent {
  @Output() started: EventEmitter<void> = new EventEmitter<void>();
  private readonly mapPlayerDefinitionsService = inject(MapPlayerDefinitionsService);

  private readonly router = inject(Router);

  /**
   * at least two players selected and at least two different teams
   */
  protected get atLeastTwoPlayersAndDifferentTeamsSelected(): boolean {
    const selectedMap = this.mapPlayerDefinitionsService.selectedMap;
    if (!selectedMap) {
      return false;
    }
    const playerPositions = selectedMap.playerPositions;
    const selectedPlayers = playerPositions.filter((startPosition) => startPosition.player.joined);
    const selectedEmptyTeams = playerPositions.filter(
      (startPosition) => startPosition.team === null && startPosition.player.joined
    );
    const selectedTeams = playerPositions.filter(
      (startPosition) => startPosition.team !== null && startPosition.player.joined
    );
    const selectedTeamsSet = new Set(selectedTeams.map((startPosition) => startPosition.team));
    return selectedPlayers.length >= 2 && selectedEmptyTeams.length + selectedTeamsSet.size >= 2;
  }

  protected async start() {
    this.started.emit();
  }

  protected async leaveClick() {
    await this.router.navigate(["probable-waffle"]);
  }
}
