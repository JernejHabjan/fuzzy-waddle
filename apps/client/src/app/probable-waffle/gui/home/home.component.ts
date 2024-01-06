import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ConstellationEffectComponent } from "./constellation-effect/constellation-effect.component";
import { HomePageNavComponent } from "./home-page-nav/home-page-nav.component";

@Component({
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
  standalone: true,
  imports: [CommonModule, ConstellationEffectComponent, HomePageNavComponent]
})
export class HomeComponent {}
