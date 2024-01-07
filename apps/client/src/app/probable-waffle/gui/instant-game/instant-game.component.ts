import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import {
  GameSessionState,
  ProbableWaffleGameInstanceType,
  ProbableWaffleGameInstanceVisibility,
  ProbableWaffleLevels
} from "@fuzzy-waddle/api-interfaces";
import { LoaderComponent } from "../../../shared/loader/loader.component";

@Component({
  selector: "fuzzy-waddle-instant-game",
  standalone: true,
  imports: [CommonModule, LoaderComponent],
  template: `<fuzzy-waddle-loader />`
})
export class InstantGameComponent implements OnInit {
  private readonly gameInstanceClientService = inject(GameInstanceClientService);

  async ngOnInit(): Promise<void> {
    await this.gameInstanceClientService.createGameInstance(
      "InstantGame",
      ProbableWaffleGameInstanceVisibility.Private,
      ProbableWaffleGameInstanceType.InstantGame
    );
    await this.gameInstanceClientService.addSelfAsPlayer();
    await this.gameInstanceClientService.addAiPlayer();

    const allMaps = Object.values(ProbableWaffleLevels);
    const map = allMaps[Math.floor(Math.random() * allMaps.length)].id;
    await this.gameInstanceClientService.gameModeChanged("map", { map });
    await this.gameInstanceClientService.gameInstanceMetadataChanged("sessionState", {
      sessionState: GameSessionState.MovingPlayersToGame
    });

    await this.gameInstanceClientService.navigateToLobbyOrDirectlyToGame();
  }
}
