import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { MapPlayerDefinition } from '../skirmish.component';

@Component({
  selector: 'fuzzy-waddle-trigger',
  templateUrl: './trigger.component.html',
  styleUrls: ['./trigger.component.scss']
})
export class TriggerComponent {
  @Input({ required: true }) selectedMap?: MapPlayerDefinition;

  constructor(private router: Router) {}

  /**
   * at least two players selected and at least two different teams
   */
  get atLeastTwoPlayersAndDifferentTeamsSelected(): boolean {
    if (!this.selectedMap) {
      return false;
    }
    const selectedPlayers = this.selectedMap.startPositionPerPlayer.filter(
      (startPosition) => startPosition.player.joined
    );
    const selectedEmptyTeams = this.selectedMap.startPositionPerPlayer.filter(
      (startPosition) => startPosition.team === null && startPosition.player.joined
    );
    const selectedTeams = this.selectedMap.startPositionPerPlayer.filter(
      (startPosition) => startPosition.team !== null && startPosition.player.joined
    );
    const selectedTeamsSet = new Set(selectedTeams.map((startPosition) => startPosition.team));
    return selectedPlayers.length >= 2 && selectedEmptyTeams.length + selectedTeamsSet.size >= 2;
  }

  start() {
    // todo use this to set the real game mode!
    console.log('selected map definitions');

    this.router.navigate(['probable-waffle/game']);
  }

  leaveClick() {
    this.router.navigate(['probable-waffle']);
  }
}
