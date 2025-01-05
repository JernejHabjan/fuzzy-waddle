import { Component, inject, OnInit } from "@angular/core";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { ProbableWaffleGameInstanceType, ProbableWaffleGameInstanceVisibility } from "@fuzzy-waddle/api-interfaces";
import { LoaderComponent } from "../../../shared/loader/loader.component";
import { AngularHost } from "../../../shared/consts";

@Component({
  template: `<fuzzy-waddle-loader />`,
  standalone: true,
  imports: [LoaderComponent],
  host: AngularHost.contentFlexFullHeightCenter
})
export class SkirmishComponent implements OnInit {
  private readonly gameInstanceClientService = inject(GameInstanceClientService);

  async ngOnInit(): Promise<void> {
    await this.gameInstanceClientService.createGameInstance(
      "Skirmish",
      ProbableWaffleGameInstanceVisibility.Private,
      ProbableWaffleGameInstanceType.Skirmish
    );
    await this.gameInstanceClientService.addSelfAsPlayer();
    await this.gameInstanceClientService.addAiPlayer();
    await this.gameInstanceClientService.navigateToLobbyOrDirectlyToGame();
  }
}
