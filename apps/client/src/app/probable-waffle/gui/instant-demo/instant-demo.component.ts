import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import {
  GameSessionState,
  ProbableWaffleGameInstanceType,
  ProbableWaffleGameInstanceVisibility,
  ProbableWaffleMapEnum
} from "@fuzzy-waddle/api-interfaces";
import { LoaderComponent } from "../../../shared/loader/loader.component";

@Component({
  selector: "fuzzy-waddle-instant-demo",
  standalone: true,
  imports: [CommonModule, LoaderComponent],
  template: `<fuzzy-waddle-loader />`
})
export class InstantDemoComponent implements OnInit {
  private readonly gameInstanceClientService = inject(GameInstanceClientService);

  async ngOnInit(): Promise<void> {
    await this.gameInstanceClientService.createGameInstance(
      "InstantDemo",
      ProbableWaffleGameInstanceVisibility.Private,
      ProbableWaffleGameInstanceType.InstantDemo
    );
    await this.gameInstanceClientService.addSelfAsPlayer();
    await this.gameInstanceClientService.addAiPlayer();
    await this.gameInstanceClientService.gameModeChanged("map", { map: ProbableWaffleMapEnum.RiverCrossing });
    await this.gameInstanceClientService.gameInstanceMetadataChanged("sessionState", {
      sessionState: GameSessionState.MovingPlayersToGame
    });

    await this.gameInstanceClientService.navigateToLobbyOrDirectlyToGame();
  }
}
