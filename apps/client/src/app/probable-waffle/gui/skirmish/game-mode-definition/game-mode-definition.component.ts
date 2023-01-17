import { Component } from '@angular/core';
import { Resources, ResourceType } from '../../../game/entity/economy/resource/resource-type';

class WinConditions {
  constructor(public timeLimit: number | null = null, public scoreLimit: number | null = null) {}
}

class MapTuning {
  constructor(
    public techLevel: number = 1,
    public gameSpeed: number = 1,
    public revealMap: boolean = false,
    public unitCap: number = 20
  ) {}
}

class DifficultyModifiers {
  constructor(
    public aiAdvantageResources: Map<ResourceType, number> = new Map<ResourceType, number>([
      [Resources.wood, 100],
      [Resources.stone, 100]
    ]),
    public reducedVisibility: boolean = false,
    public reducedIncome: number = 0.5,
    public unitsDieOfAge: boolean = false
  ) {}
}

class GameModeLobby {
  constructor(
    public winConditions: WinConditions = new WinConditions(),
    public mapTuning: MapTuning = new MapTuning(),
    public difficultyModifiers: DifficultyModifiers = new DifficultyModifiers()
  ) {}
}

@Component({
  selector: 'fuzzy-waddle-game-mode-definition',
  templateUrl: './game-mode-definition.component.html',
  styleUrls: ['./game-mode-definition.component.scss']
})
export class GameModeDefinitionComponent {
  gameModeLobby: GameModeLobby;

  constructor() {
    this.gameModeLobby = new GameModeLobby();
  }

  onValueChange() {
    console.log('game setup changed');
  }
}
