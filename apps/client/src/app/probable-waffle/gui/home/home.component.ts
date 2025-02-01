import { Component } from "@angular/core";

import { ConstellationEffectComponent } from "./constellation-effect/constellation-effect.component";
import { HomePageNavComponent } from "./home-page-nav/home-page-nav.component";
import { AngularHost } from "../../../shared/consts";

@Component({
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
  imports: [ConstellationEffectComponent, HomePageNavComponent],
  host: AngularHost.contentFlexFullHeight
})
export class HomeComponent {}
