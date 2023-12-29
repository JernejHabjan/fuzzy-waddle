import { Component, inject } from "@angular/core";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { ProbableWaffleGameInstanceType } from "@fuzzy-waddle/api-interfaces";
import { Router } from "@angular/router";

@Component({
  selector: "probable-waffle-host",
  templateUrl: "./host.component.html",
  styleUrls: ["./host.component.scss"]
})
export class HostComponent {
  protected readonly gameInstanceClientService = inject(GameInstanceClientService);
  private readonly router = inject(Router);

  protected gameModeLobby = {
    lobbyName: "",
    visibility: "public",
    setPassword: ""
  };

  protected async createLobby() {
    await this.gameInstanceClientService.createGameInstance(true, ProbableWaffleGameInstanceType.SelfHosted);
    await this.router.navigate(["probable-waffle/lobby"]);
  }
}
