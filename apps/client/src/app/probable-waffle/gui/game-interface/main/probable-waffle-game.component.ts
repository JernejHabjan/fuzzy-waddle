import { Component, OnDestroy, OnInit } from "@angular/core";
import { SceneCommunicatorService } from "../../../communicators/scene-communicator.service";
import { probableWaffleGameConfig } from "../../../game/world/const/game-config";
import { BaseGameData } from "../../../../shared/game/phaser/game/base-game-data";
import { LittleMuncherGameInstance, LittleMuncherUserInfo } from "@fuzzy-waddle/api-interfaces";
import { LittleMuncherCommunicatorService } from "../../../../little-muncher/game/little-muncher-communicator.service";
import { AuthService } from "../../../../auth/auth.service";

@Component({
  selector: "fuzzy-waddle-game",
  templateUrl: "./probable-waffle-game.component.html",
  styleUrls: ["./probable-waffle-game.component.scss"]
})
export class ProbableWaffleGameComponent implements OnInit, OnDestroy {
  protected readonly probableWaffleGameConfig = probableWaffleGameConfig;
  drawerWidth = "150px";
  displayDrawers = true; // todo
  gameData?: BaseGameData<LittleMuncherCommunicatorService, LittleMuncherGameInstance, LittleMuncherUserInfo>; // todo

  constructor(
    private readonly communicatorService: LittleMuncherCommunicatorService,
    private readonly authService: AuthService
  ) {}

  ngOnDestroy(): void {
    SceneCommunicatorService.unsubscribe();
  }

  ngOnInit(): void {
    SceneCommunicatorService.setup();
    const gameSessionInstance = new LittleMuncherGameInstance(); // todo later use ProbableWaffleGameInstance
    this.gameData = {
      gameInstance: gameSessionInstance,
      communicator: this.communicatorService,
      user: new LittleMuncherUserInfo(this.authService.userId) // todo later use ProbableWaffleUserInfo
    };

    // todo properly listen with communicatorService

    if (window.innerWidth < 800) {
      this.displayDrawers = false; // todo for now
    }
  }
}
