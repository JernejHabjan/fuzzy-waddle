import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MapPlayerDefinition, PositionPlayerDefinition } from '../probable-waffle-skirmish.component';

export enum PlayerType {
  Human,
  AI
}

export const playerTypeLookup = {
  [PlayerType.Human]: 'Human',
  [PlayerType.AI]: 'A.I.'
};

@Component({
  selector: 'fuzzy-waddle-probable-waffle-player-definition',
  templateUrl: './probable-waffle-player-definition.component.html',
  styleUrls: ['./probable-waffle-player-definition.component.scss']
})
export class ProbableWafflePlayerDefinitionComponent {
  playerTypeLookup = playerTypeLookup;
  PlayerType = PlayerType;

  @Input() selectedMap?: MapPlayerDefinition;
  @Output() playerJoined: EventEmitter<void> = new EventEmitter<void>();
  @Output() playerRemoved: EventEmitter<PositionPlayerDefinition> = new EventEmitter<PositionPlayerDefinition>();

  addPlayer(playerIndex: number) {
    const map = this.selectedMap as MapPlayerDefinition;
    const startPositionPerPlayerElement = map.startPositionPerPlayer[playerIndex];
    startPositionPerPlayerElement.player.playerPosition = this.firstFreePosition;
    startPositionPerPlayerElement.player.joined = true;
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
