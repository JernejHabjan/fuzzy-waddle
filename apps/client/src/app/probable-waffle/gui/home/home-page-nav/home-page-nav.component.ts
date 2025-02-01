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
  protected readonly enabledCampaign = !environment.production; // todo
  protected readonly enabledProgress = !environment.production; // todo
  protected readonly enabledOptions: boolean = !environment.production; // todo
}
