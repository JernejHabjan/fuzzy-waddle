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

  protected gameModeLobby: {
    lobbyName: string;
    visibility: "public" | "private";
    setPassword: string;
  } = {
    lobbyName: "",
    visibility: "public",
    setPassword: ""
  };

  protected async createLobby() {
    console.warn("todo use game mode lobby here"); // todo use game mode lobby here

    await this.gameInstanceClientService.createGameInstance(
      this.gameModeLobby.visibility === "public", // todo?
      ProbableWaffleGameInstanceType.SelfHosted
    );
    await this.gameInstanceClientService.addSelfAsPlayer();
    await this.router.navigate(["probable-waffle/lobby"]);
  }
}
