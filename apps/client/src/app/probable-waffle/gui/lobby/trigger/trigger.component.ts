import { Component, EventEmitter, inject, Input, Output } from "@angular/core";
import { Router } from "@angular/router";
import { MapPlayerDefinition } from "../map-player-definition";

@Component({
  selector: "probable-waffle-trigger",
  templateUrl: "./trigger.component.html",
  styleUrls: ["./trigger.component.scss"]
})
export class TriggerComponent {
  @Input({ required: true }) selectedMap: MapPlayerDefinition | undefined;
  @Output() started: EventEmitter<void> = new EventEmitter<void>();

  private readonly router = inject(Router);

  /**
   * at least two players selected and at least two different teams
   */
  protected get atLeastTwoPlayersAndDifferentTeamsSelected(): boolean {
    if (!this.selectedMap) {
      return false;
    }
    const selectedPlayers = this.selectedMap.playerPositions.filter((startPosition) => startPosition.player.joined);
    const selectedEmptyTeams = this.selectedMap.playerPositions.filter(
      (startPosition) => startPosition.team === null && startPosition.player.joined
    );
    const selectedTeams = this.selectedMap.playerPositions.filter(
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
