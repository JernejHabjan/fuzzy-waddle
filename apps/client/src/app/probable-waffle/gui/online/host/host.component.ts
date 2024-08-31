import { Component, inject } from "@angular/core";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { ProbableWaffleGameInstanceType, ProbableWaffleGameInstanceVisibility } from "@fuzzy-waddle/api-interfaces";
import { Router } from "@angular/router";

import { FormsModule } from "@angular/forms";

@Component({
  selector: "probable-waffle-host",
  templateUrl: "./host.component.html",
  styleUrls: ["./host.component.scss"],
  standalone: true,
  imports: [FormsModule]
})
export class HostComponent {
  protected readonly gameInstanceClientService = inject(GameInstanceClientService);
  private readonly router = inject(Router);

  protected gameModeLobby: {
    lobbyName: string;
    visibility: ProbableWaffleGameInstanceVisibility;
  } = {
    lobbyName: "",
    visibility: ProbableWaffleGameInstanceVisibility.Public
  };

  protected async createLobby() {
    await this.gameInstanceClientService.createGameInstance(
      this.gameModeLobby.lobbyName,
      this.gameModeLobby.visibility,
      ProbableWaffleGameInstanceType.SelfHosted
    );
    await this.gameInstanceClientService.addSelfAsPlayer();
    await this.gameInstanceClientService.navigateToLobbyOrDirectlyToGame();
  }
}
