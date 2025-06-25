import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { environment } from "../../../../../environments/environment";
import { RouterLink } from "@angular/router";

@Component({
  selector: "probable-waffle-main-menu-buttons",
  imports: [CommonModule, RouterLink],
  templateUrl: "./main-menu-buttons.component.html",
  styleUrl: "./main-menu-buttons.component.scss"
})
export class MainMenuButtonsComponent {
  protected readonly enabledInstantDemoGame = !environment.production;
  protected readonly enabledMultiplayer = !environment.production;
  protected readonly enabledReplay = !environment.production;
  protected readonly enabledCampaign = !environment.production;
  protected readonly enabledProgress = !environment.production;
  protected readonly enabledOptions = true;
}
