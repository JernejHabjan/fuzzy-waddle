import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MapInfo, Maps } from '../probable-waffle-game/scenes/scenes';

export class MapPlayerDefinition {
  startPositionPerPlayer: number[] = [];
  teamNamePerPlayer: string[] = [];

  constructor(public map: MapInfo) {
    for (let i = 0; i < map.startPositions.length; i++) {
      this.startPositionPerPlayer.push(-1);
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
    this.mapPlayerDefinitions = Maps.maps.map(map => new MapPlayerDefinition(map));
  }

  get atLeastTwoPlayersSelected():boolean {
    return this.mapPlayerDefinitions.some(mapPlayerDefinition => {
      return mapPlayerDefinition.startPositionPerPlayer.filter(startPosition => startPosition !== -1).length >= 2;
    });
  }

  start() {
    this.router.navigate(['probable-waffle/game']);
  }

  leaveClick() {
    this.router.navigate(['probable-waffle']);
  }
}
