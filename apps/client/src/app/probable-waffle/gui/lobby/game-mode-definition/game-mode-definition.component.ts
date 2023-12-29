import { Component, Output } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { ProbableWaffleGameModeLobby } from "@fuzzy-waddle/api-interfaces";

@Component({
  selector: "fuzzy-waddle-game-mode-definition",
  templateUrl: "./game-mode-definition.component.html",
  styleUrls: ["./game-mode-definition.component.scss"]
})
export class GameModeDefinitionComponent {
  gameModeLobby: ProbableWaffleGameModeLobby;
  @Output() gameModeLobbyChange;

  constructor() {
    this.gameModeLobby = new ProbableWaffleGameModeLobby();
    this.gameModeLobbyChange = new BehaviorSubject<ProbableWaffleGameModeLobby>(this.gameModeLobby);
  }

  onValueChange() {
    console.log("game setup changed");
    this.gameModeLobbyChange.next(this.gameModeLobby);
  }
}
