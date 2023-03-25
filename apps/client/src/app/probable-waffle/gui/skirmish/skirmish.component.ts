import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MapInfo } from '../../game/world/scenes/scenes';
import { RaceDefinitions, RaceType } from '../../game/player/race-definitions';
import { MapDefinitionComponent } from './map-definition/map-definition.component';
import { Difficulty, PlayerType } from './player-definition/player-definition.component';
import { GameModeLobby } from './game-mode-definition/game-mode-lobby';

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

  constructor(public map: MapInfo) {
    this.allPossibleTeams.push(null);
    const races = RaceDefinitions.raceTypes;
    for (let i = 0; i < map.startPositions.length; i++) {
      const randomRace = races[Math.floor(Math.random() * races.length)];
      const playerColor = `hsl(${(i * 360) / map.startPositions.length}, 100%, 50%)`;
      // use initialNrAiPlayers to set the first x players to ai
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

  get playerPositions(): PositionPlayerDefinition[] {
    return this.startPositionPerPlayer.filter((positionPlayer) => positionPlayer.player.playerPosition !== null);
  }
}

@Component({
  selector: 'fuzzy-waddle-skirmish',
  templateUrl: './skirmish.component.html',
  styleUrls: ['./skirmish.component.scss']
})
export class SkirmishComponent {
  @ViewChild('mapDefinition') mapDefinition!: MapDefinitionComponent;
  selectedMap?: MapPlayerDefinition;
  gameModeLobby!: GameModeLobby;

  constructor(private router: Router, private cd: ChangeDetectorRef) {}

  playerCountChanged() {
    this.mapDefinition.initializePlayerPositions();
    this.mapDefinition.draw();
  }

  playerRemoved(positionPlayerDefinition: PositionPlayerDefinition) {
    this.mapDefinition.removePlayer(positionPlayerDefinition.player.playerNumber);
    this.playerCountChanged();
  }

  mapChanged($event: MapPlayerDefinition) {
    this.selectedMap = $event;
    this.cd.detectChanges();
  }
}
