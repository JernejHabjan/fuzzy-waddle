import { Component, Output } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import {
  DifficultyModifiers,
  MapTuning,
  ProbableWaffleGameModeLobby,
  Resources,
  ResourceType,
  WinConditions
} from "@fuzzy-waddle/api-interfaces";

@Component({
  selector: "probable-waffle-game-mode-definition",
  templateUrl: "./game-mode-definition.component.html",
  styleUrls: ["./game-mode-definition.component.scss"]
})
export class GameModeDefinitionComponent {
  gameModeLobby: ProbableWaffleGameModeLobby;
  @Output() gameModeLobbyChange;

  constructor() {
    this.gameModeLobby = {
      difficultyModifiers: {
        reducedIncome: 0.5,
        aiAdvantageResources: new Map<ResourceType, number>([
          [Resources.wood, 100],
          [Resources.stone, 100]
        ])
      } satisfies DifficultyModifiers,
      mapTuning: {
        unitCap: 20
      } satisfies MapTuning,
      winConditions: {
        timeLimit: 60
      } satisfies WinConditions
    } satisfies ProbableWaffleGameModeLobby;
    this.gameModeLobbyChange = new BehaviorSubject<ProbableWaffleGameModeLobby>(this.gameModeLobby);
  }

  onValueChange() {
    console.log("game setup changed");
    this.gameModeLobbyChange.next(this.gameModeLobby);
  }
}
