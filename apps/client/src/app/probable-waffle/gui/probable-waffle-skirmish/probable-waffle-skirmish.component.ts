import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MapInfo } from '../../probable-waffle-game/scenes/scenes';
import { RaceDefinitions, RaceType } from '../../probable-waffle-game/race-definitions';
import { ProbableWaffleMapDefinitionComponent } from './probable-waffle-map-definition/probable-waffle-map-definition.component';
import {
  Difficulty,
  PlayerType
} from './probable-waffle-player-definition/probable-waffle-player-definition.component';
import { ProbableWaffleGameModeDefinitionComponent } from './probable-waffle-game-mode-definition/probable-waffle-game-mode-definition.component';

export class PlayerLobbyDefinition {
  constructor(public playerNumber: number, public playerPosition: number | null, public joined: boolean) {}
}
export class PositionPlayerDefinition {
  constructor(
    public player: PlayerLobbyDefinition,
    public team: number | null,
    public raceType: RaceType,
    public playerType: PlayerType,
    public playerColor: string,
    public difficulty: Difficulty | null
  ) {}
}
export class MapPlayerDefinition {
  startPositionPerPlayer: PositionPlayerDefinition[] = [];
  allPossibleTeams: (number | null)[] = [];
  initialNrAiPlayers = 1;

  get playerPositions(): PositionPlayerDefinition[] {
    return this.startPositionPerPlayer.filter((positionPlayer) => positionPlayer.player.playerPosition !== null);
  }
  constructor(public map: MapInfo) {
    this.allPossibleTeams.push(null);
    const races = RaceDefinitions.raceTypes;
    for (let i = 0; i < map.startPositions.length; i++) {
      const randomRace = races[Math.floor(Math.random() * races.length)];
      const playerColor = `hsl(${(i * 360) / map.startPositions.length}, 100%, 50%)`;
      // use initialNrAiPlayers to set the first x players to AI
      const shouldAutoJoin = i < this.initialNrAiPlayers + 1; // 1 for human player
      const isAi = i > 0 && shouldAutoJoin;
      this.startPositionPerPlayer.push(
        new PositionPlayerDefinition(
          new PlayerLobbyDefinition(i, shouldAutoJoin ? i : null, shouldAutoJoin),
          null,
          randomRace.value,
          !isAi ? PlayerType.Human : PlayerType.AI,
          playerColor,
          isAi ? Difficulty.Medium : null
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
  @ViewChild('gameModeDefinition') gameModeDefinition!: ProbableWaffleGameModeDefinitionComponent;
  selectedMap?: MapPlayerDefinition;
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
    const gameModeLobby = this.gameModeDefinition.gameModeLobby;
    // todo use this to set the real game mode!
    console.log('selected map definitions', this.selectedMap, gameModeLobby);

    this.router.navigate(['probable-waffle/game']);
  }

  leaveClick() {
    this.router.navigate(['probable-waffle']);
  }

  playerCountChanged() {
    this.mapDefinition.initializePlayerPositions();
    this.mapDefinition.draw();
  }

  playerRemoved(positionPlayerDefinition: PositionPlayerDefinition) {
    this.mapDefinition.removePlayer(positionPlayerDefinition.player.playerNumber);
    this.playerCountChanged();
  }
}
