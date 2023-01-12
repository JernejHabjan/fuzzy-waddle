import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MapInfo, Maps } from '../probable-waffle-game/scenes/scenes';

export class PositionPlayerDefinition {
  constructor(public position: number, public player: number | null, public team: number | null) {}
}
export class MapPlayerDefinition {
  startPositionPerPlayer: PositionPlayerDefinition[] = [];
  allPossibleTeams: (number | null)[] = [];
  constructor(public map: MapInfo) {
    this.allPossibleTeams.push(null);
    for (let i = 0; i < map.startPositions.length; i++) {
      this.startPositionPerPlayer.push(new PositionPlayerDefinition(i, null, null));
      this.allPossibleTeams.push(i);
    }
  }
}
@Component({
  selector: 'fuzzy-waddle-probable-waffle-skirmish',
  templateUrl: './probable-waffle-skirmish.component.html',
  styleUrls: ['./probable-waffle-skirmish.component.scss']
})
export class ProbableWaffleSkirmishComponent {
  Maps = Maps;
  configured = false;
  dropdownVisible = false;
  selectedMap?: MapPlayerDefinition;
  mapPlayerDefinitions: MapPlayerDefinition[];
  constructor(private router: Router) {
    this.mapPlayerDefinitions = Maps.maps.map((map) => new MapPlayerDefinition(map));
  }

  /**
   * at least two players selected and at least two different teams
   */
  get atLeastTwoPlayersAndDifferentTeamsSelected(): boolean {
    if (!this.selectedMap) {
      return false;
    }
    const selectedPlayers = this.selectedMap.startPositionPerPlayer.filter(
      (startPosition) => startPosition.player !== null
    );
    const selectedEmptyTeams = this.selectedMap.startPositionPerPlayer.filter(
      (startPosition) => startPosition.team === null
    );
    const selectedTeams = this.selectedMap.startPositionPerPlayer.filter(
      (startPosition) => startPosition.team !== null
    );
    const selectedTeamsSet = new Set(selectedTeams.map((startPosition) => startPosition.team));
    return selectedPlayers.length >= 2 && selectedEmptyTeams.length + selectedTeamsSet.size >= 2;
  }

  start() {
    this.router.navigate(['probable-waffle/game']);
  }

  leaveClick() {
    this.router.navigate(['probable-waffle']);
  }
}
