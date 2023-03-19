import { Component, Output } from '@angular/core';
import { GameModeLobby } from './game-mode-lobby';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'fuzzy-waddle-game-mode-definition',
  templateUrl: './game-mode-definition.component.html',
  styleUrls: ['./game-mode-definition.component.scss']
})
export class GameModeDefinitionComponent {
  gameModeLobby: GameModeLobby;
  @Output() gameModeLobbyChange;

  constructor() {
    this.gameModeLobby = new GameModeLobby();
    this.gameModeLobbyChange = new BehaviorSubject<GameModeLobby>(this.gameModeLobby);
  }

  onValueChange() {
    console.log('game setup changed');
    this.gameModeLobbyChange.next(this.gameModeLobby);
  }
}
