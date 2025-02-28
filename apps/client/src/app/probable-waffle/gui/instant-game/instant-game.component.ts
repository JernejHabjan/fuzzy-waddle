import { Component, inject, OnInit } from "@angular/core";

import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import {
  FactionType,
  GameSessionState,
  ProbableWaffleGameInstanceType,
  ProbableWaffleGameInstanceVisibility,
  ProbableWaffleMapEnum
} from "@fuzzy-waddle/api-interfaces";
import { LoaderComponent } from "../../../shared/loader/loader.component";
import { AngularHost } from "../../../shared/consts";

@Component({
  selector: "fuzzy-waddle-instant-game",
  imports: [LoaderComponent],
  host: AngularHost.contentFlexFullHeightCenter,
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
    const currentPlayer = await this.gameInstanceClientService.addSelfAsPlayer();
    const aiPlayer = await this.gameInstanceClientService.addAiPlayer();

    currentPlayer.factionType = FactionType.Tivara;
    aiPlayer.factionType = FactionType.Skaduwee;

    // const allMaps = Object.values(ProbableWaffleLevels);
    // const map = allMaps[Math.floor(Math.random() * allMaps.length)].id;
    const map = ProbableWaffleMapEnum.Sandbox;
    await this.gameInstanceClientService.gameModeChanged("map", { map });
    await this.gameInstanceClientService.gameInstanceMetadataChanged("sessionState", {
      sessionState: GameSessionState.MovingPlayersToGame
    });

    await this.gameInstanceClientService.navigateToLobbyOrDirectlyToGame();
  }
}
