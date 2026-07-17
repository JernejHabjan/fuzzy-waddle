import { Component } from "@angular/core";
import { FlySquasherLevels } from "@fuzzy-waddle/fly-squasher-protocol";
import { KeyValuePipe } from "@angular/common";
import { RouterLink } from "@angular/router";
import { AngularHost } from "@fuzzy-waddle/platform-game-host/angular/consts";
import { HomeNavComponent } from "@fuzzy-waddle/platform-identity/client/home-nav/home-nav.component";
import { CenterWrapperComponent } from "@fuzzy-waddle/platform-game-host/angular/components/center-wrapper/center-wrapper.component";

@Component({
  selector: "fly-squasher-choose-level",
  templateUrl: "./choose-level.component.html",
  styleUrls: ["./choose-level.component.scss"],
  imports: [RouterLink, HomeNavComponent, CenterWrapperComponent, KeyValuePipe],
  host: AngularHost.contentFlexFullHeight
})
export class ChooseLevelComponent {
  protected readonly flySquasherLevels = FlySquasherLevels;
  protected readonly levelCount = Object.keys(FlySquasherLevels).length;
}
