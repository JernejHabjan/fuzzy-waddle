import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { ProbableWaffleGameInstanceType, ProbableWaffleGameInstanceVisibility } from "@fuzzy-waddle/api-interfaces";

@Component({
  template: `Navigating to lobby...`,
  standalone: true,
  imports: [CommonModule]
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
