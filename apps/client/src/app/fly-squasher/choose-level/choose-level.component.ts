import { Component } from "@angular/core";
import { FlySquasherLevels } from "@fuzzy-waddle/api-interfaces";

@Component({
  selector: "fly-squasher-choose-level",
  templateUrl: "./choose-level.component.html",
  styleUrls: ["./choose-level.component.scss"]
})
export class ChooseLevelComponent {
  protected readonly flySquasherLevels = FlySquasherLevels;
}
