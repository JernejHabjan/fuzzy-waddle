import { Component } from "@angular/core";
import { FlySquasherLevels } from "@fuzzy-waddle/api-interfaces";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { AngularHost } from "../../shared/consts";
import { LeaveButtonComponent } from "../../shared/components/leave-button.component";

@Component({
  selector: "fly-squasher-choose-level",
  templateUrl: "./choose-level.component.html",
  styleUrls: ["./choose-level.component.scss"],
  imports: [CommonModule, RouterLink, LeaveButtonComponent],
  host: AngularHost.contentFlexFullHeightCenter
})
export class ChooseLevelComponent {
  protected readonly flySquasherLevels = FlySquasherLevels;
}
