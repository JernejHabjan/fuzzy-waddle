import { Component } from "@angular/core";
import { environment } from "../../../../../environments/environment";

import { HomeNavComponent } from "../../../../shared/components/home-nav/home-nav.component";
import { RouterLink } from "@angular/router";

@Component({
  selector: "probable-waffle-home-page-nav",
  templateUrl: "./home-page-nav.component.html",
  styleUrls: ["./home-page-nav.component.scss"],
  imports: [HomeNavComponent, RouterLink]
})
export class HomePageNavComponent {
  protected readonly enabledInstantDemoGame = !environment.production;
  protected readonly enabledMultiplayer = !environment.production;
  protected readonly enabledReplay = !environment.production;
  protected readonly enabledCampaign = !environment.production;
  protected readonly enabledProgress = !environment.production;
  protected readonly enabledOptions = true;
}
