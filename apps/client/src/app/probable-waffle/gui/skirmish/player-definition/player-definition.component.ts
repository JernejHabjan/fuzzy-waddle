import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MapPlayerDefinition, PositionPlayerDefinition } from '../skirmish.component';
import { RaceDefinitions } from '../../../game/player/race-definitions';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

export enum PlayerType {
  Human=0,
  AI=1
}

export class PlayerTypeDefinitions{
  static playerTypes = [
    { value: PlayerType.Human, name: 'Human' },
    { value: PlayerType.AI, name: 'AI' }
  ];
  static playerTypeLookup = {
    [PlayerType.Human]: 'Human',
    [PlayerType.AI]: 'A.I.'
  };
}

export enum Difficulty{
  Easy=0,
  Medium=1,
  Hard=2
}
export class DifficultyDefinitions{
  static difficulties = [
    { name: 'Easy', value: Difficulty.Easy },
    { name: 'Normal', value: Difficulty.Medium },
    { name: 'Hard', value: Difficulty.Hard }
  ]
}

@Component({
  selector: 'fuzzy-waddle-player-definition',
  templateUrl: './player-definition.component.html',
  styleUrls: ['./player-definition.component.scss']
})
export class PlayerDefinitionComponent {
  PlayerTypeDefinitions = PlayerTypeDefinitions;
  PlayerType = PlayerType;
  RaceDefinitions = RaceDefinitions;
  DifficultyDefinitions=DifficultyDefinitions;
  @Input() selectedMap?: MapPlayerDefinition;
  @Output() playerJoined: EventEmitter<void> = new EventEmitter<void>();
  @Output() playerRemoved: EventEmitter<PositionPlayerDefinition> = new EventEmitter<PositionPlayerDefinition>();

  addPlayer(playerIndex: number) {
    const map = this.selectedMap as MapPlayerDefinition;
    const startPositionPerPlayerElement = map.startPositionPerPlayer[playerIndex];
    startPositionPerPlayerElement.player.playerPosition = this.firstFreePosition;
    startPositionPerPlayerElement.player.joined = true;
    startPositionPerPlayerElement.difficulty = Difficulty.Medium;
    this.playerJoined.emit();
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

  removePlayer(playerNumber: number) {
    const map = this.selectedMap as MapPlayerDefinition;
    const startPositionPerPlayerElement = map.startPositionPerPlayer[playerNumber];
    startPositionPerPlayerElement.player.playerPosition = null;
    startPositionPerPlayerElement.player.joined = false;
    this.playerRemoved.emit(startPositionPerPlayerElement);
  }
}
