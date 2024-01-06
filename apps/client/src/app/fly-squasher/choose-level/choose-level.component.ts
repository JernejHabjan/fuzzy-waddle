import { Component } from "@angular/core";
import { FlySquasherLevels } from "@fuzzy-waddle/api-interfaces";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";

@Component({
  selector: "fly-squasher-choose-level",
  templateUrl: "./choose-level.component.html",
  styleUrls: ["./choose-level.component.scss"],
  standalone: true,
  imports: [CommonModule, RouterLink]
})
export class ChooseLevelComponent {
  protected readonly flySquasherLevels = FlySquasherLevels;
}
