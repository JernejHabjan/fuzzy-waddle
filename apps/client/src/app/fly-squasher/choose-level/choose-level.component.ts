import { Component } from "@angular/core";
import { FlySquasherLevels } from "@fuzzy-waddle/api-interfaces";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { AngularHost } from "../../shared/consts";
import { HomeNavComponent } from "../../shared/components/home-nav/home-nav.component";
import { CenterWrapperComponent } from "../../shared/components/center-wrapper/center-wrapper.component";

@Component({
  selector: "fly-squasher-choose-level",
  templateUrl: "./choose-level.component.html",
  styleUrls: ["./choose-level.component.scss"],
  imports: [CommonModule, RouterLink, HomeNavComponent, CenterWrapperComponent],
  host: AngularHost.contentFlexFullHeight
})
export class ChooseLevelComponent {
  protected readonly flySquasherLevels = FlySquasherLevels;
}
