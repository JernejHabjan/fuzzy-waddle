import { Component } from "@angular/core";

import { ConstellationEffectComponent } from "./constellation-effect/constellation-effect.component";
import { HomePageNavComponent } from "./home-page-nav/home-page-nav.component";

@Component({
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
  standalone: true,
  imports: [ConstellationEffectComponent, HomePageNavComponent]
})
export class HomeComponent {}
