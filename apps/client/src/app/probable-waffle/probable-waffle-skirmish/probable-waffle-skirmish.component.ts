import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MapInfo, Maps } from '../probable-waffle-game/scenes/scenes';
import { RaceType } from '../probable-waffle-game/race-definitions';
import { ProbableWaffleMapDefinitionComponent } from './probable-waffle-map-definition/probable-waffle-map-definition.component';

export enum PlayerType {
  Human,
  AI
}

export class PlayerLobbyDefinition {
  constructor(public playerNumber: number, public playerPosition: number | null, public joined: boolean) {}
}
export class PositionPlayerDefinition {
  constructor(
    public player: PlayerLobbyDefinition,
    public team: number | null,
    public raceType: RaceType,
    public playerType: PlayerType,
    public playerColor: string
  ) {}
}
export class MapPlayerDefinition {
  startPositionPerPlayer: PositionPlayerDefinition[] = [];
  allPossibleTeams: (number | null)[] = [];

  get playerPositions(): PositionPlayerDefinition[] {
    return this.startPositionPerPlayer.filter((positionPlayer) => positionPlayer.player.playerPosition !== null);
  }
  constructor(public map: MapInfo) {
    this.allPossibleTeams.push(null);
    for (let i = 0; i < map.startPositions.length; i++) {
      const playerColor = `hsl(${(i * 360) / map.startPositions.length}, 100%, 50%)`;
      this.startPositionPerPlayer.push(
        new PositionPlayerDefinition(
          new PlayerLobbyDefinition(i, i === 0 ? 0 : null, i === 0),
          null,
          RaceType.IceMarauders,
          i === 0 ? PlayerType.Human : PlayerType.AI,
          playerColor
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
  @ViewChild('mapDefinition') mapDefinition!: ProbableWaffleMapDefinitionComponent;
  dropdownVisible = false;
  selectedMap?: MapPlayerDefinition;
  mapPlayerDefinitions: MapPlayerDefinition[];
  constructor(private router: Router) {
    this.mapPlayerDefinitions = Maps.maps.map((map) => new MapPlayerDefinition(map));
    this.selectedMap = this.mapPlayerDefinitions[1];
  }

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
    this.router.navigate(['probable-waffle/game']);
  }

  leaveClick() {
    this.router.navigate(['probable-waffle']);
  }

  addPlayer(playerIndex: number) {
    const map = this.selectedMap as MapPlayerDefinition;
    const startPositionPerPlayerElement = map.startPositionPerPlayer[playerIndex];
    startPositionPerPlayerElement.player.playerPosition = this.firstFreePosition;
    startPositionPerPlayerElement.player.joined = true;
    this.mapDefinition.initializePlayerPositions(); // todo we should not reset all positions on mapDefinition
    this.mapDefinition.draw();
  }

  /**
   * get first free position
   */
  private get firstFreePosition(): number {
    const map = this.selectedMap as MapPlayerDefinition;

    // extract all positions that are already taken
    const takenPositions = map.startPositionPerPlayer
      .filter((startPosition) => startPosition.player.playerPosition !== null)
      .map((startPosition) => startPosition.player.playerPosition) as number[];
    // sort them
    takenPositions.sort();
    // get first free position
    let freePosition = 0;
    for (let i = 0; i < map.startPositionPerPlayer.length; i++) {
      if (takenPositions.includes(i)) {
        continue;
      }
      freePosition = i;
      break;
    }
    return freePosition;
  }
}
