import { Component } from "@angular/core";

import { ConstellationEffectComponent } from "./constellation-effect/constellation-effect.component";
import { AngularHost } from "../../../shared/consts";
import { MainMenuButtonsComponent } from "./main-menu-buttons/main-menu-buttons.component";
import { TitleComponent } from "./title/title.component";

@Component({
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
  imports: [ConstellationEffectComponent, MainMenuButtonsComponent, TitleComponent],
  host: AngularHost.contentFlexFullHeight
})
export class HomeComponent {}
