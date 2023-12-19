import { Component, OnDestroy, OnInit } from "@angular/core";
import {
  ProbableWaffleGameInstance,
  ProbableWaffleLevelEnum,
  ProbableWaffleUserInfo
} from "@fuzzy-waddle/api-interfaces";
import { BaseGameData } from "../../../shared/game/phaser/game/base-game-data";
import { ProbableWaffleCommunicatorService } from "../../communicators/probable-waffle-communicator.service";
import { AuthService } from "../../../auth/auth.service";
import { SceneCommunicatorService } from "../../communicators/scene-communicator.service";
import { probableWaffleGameConfig } from "../../game/world/const/game-config";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";

@Component({
  selector: "fuzzy-waddle-game",
  templateUrl: "./probable-waffle-game.component.html",
  styleUrls: ["./probable-waffle-game.component.scss"]
})
export class ProbableWaffleGameComponent implements OnInit, OnDestroy {
  protected readonly probableWaffleGameConfig = probableWaffleGameConfig;
  drawerWidth = "150px";
  displayDrawers = true; // todo
  gameData?: BaseGameData<ProbableWaffleCommunicatorService, ProbableWaffleGameInstance, ProbableWaffleUserInfo>;

  constructor(
    private readonly gameInstanceClientService: GameInstanceClientService,
    private readonly communicatorService: ProbableWaffleCommunicatorService,
    private readonly authService: AuthService
  ) {}

  ngOnDestroy(): void {
    SceneCommunicatorService.unsubscribe();
  }

  ngOnInit(): void {
    SceneCommunicatorService.setup();
    const level = this.gameInstanceClientService.gameInstance?.gameMode?.data.level;
    if (!level) throw new Error("No level");
    const gameSessionInstance = new ProbableWaffleGameInstance({
      gameModeData: {
        level: level
      }
    });
    this.gameData = {
      gameInstance: gameSessionInstance,
      communicator: this.communicatorService,
      user: new ProbableWaffleUserInfo(this.authService.userId)
    } as const;

    // todo properly listen with communicatorService

    if (window.innerWidth < 800) {
      this.displayDrawers = false; // todo for now
    }
  }
}
