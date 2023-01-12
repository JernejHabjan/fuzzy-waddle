import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MapInfo, Maps } from '../probable-waffle-game/scenes/scenes';
import { RaceType } from '../probable-waffle-game/race-definitions';

export enum PlayerType {
  Human,
  AI
}
export class PositionPlayerDefinition {
  constructor(
    public position: number,
    public player: number | null,
    public team: number | null,
    public raceType: RaceType,
    public playerType: PlayerType
  ) {}
}
export class MapPlayerDefinition {
  startPositionPerPlayer: PositionPlayerDefinition[] = [];
  allPossibleTeams: (number | null)[] = [];

  get playerPositions(): PositionPlayerDefinition[] {
    return this.startPositionPerPlayer.filter((positionPlayer) => positionPlayer.player !== null);
  }
  constructor(public map: MapInfo) {
    this.allPossibleTeams.push(null);
    for (let i = 0; i < map.startPositions.length; i++) {
      this.startPositionPerPlayer.push(
        new PositionPlayerDefinition(
          i,
          i === 0 ? 0 : null,
          null,
          RaceType.IceMarauders,
          i === 0 ? PlayerType.Human : PlayerType.AI
        )
      );
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
  dropdownVisible = false;
  selectedMap?: MapPlayerDefinition;
  mapPlayerDefinitions: MapPlayerDefinition[];
  constructor(private router: Router) {
    this.mapPlayerDefinitions = Maps.maps.map((map) => new MapPlayerDefinition(map));
    this.selectedMap = this.mapPlayerDefinitions[0];
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

  addPlayer(playerIndex: number) {
    const map = this.selectedMap as MapPlayerDefinition;
    const player = map.startPositionPerPlayer[playerIndex];
    if (player.player === null) {
      player.player = playerIndex;
      this.selectedMap = undefined;
      setTimeout(() => {
        // trigger push change detection
        this.selectedMap = map;
      }, 0);
    }
  }
}
