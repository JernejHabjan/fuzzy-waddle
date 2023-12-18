import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { SceneCommunicatorService } from "../../../communicators/scene-communicator.service";
import { probableWaffleGameConfig } from "../../../game/world/const/game-config";
import { BaseGameData } from "../../../../shared/game/phaser/game/base-game-data";
import {
  ProbableWaffleGameInstance,
  ProbableWaffleLevelEnum,
  ProbableWaffleLevels,
  ProbableWaffleUserInfo
} from "@fuzzy-waddle/api-interfaces";
import { AuthService } from "../../../../auth/auth.service";
import { ProbableWaffleCommunicatorService } from "../../../game/scenes/probable-waffle-communicator.service";

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
    private readonly communicatorService: ProbableWaffleCommunicatorService,
    private readonly authService: AuthService
  ) {}

  ngOnDestroy(): void {
    SceneCommunicatorService.unsubscribe();
  }

  ngOnInit(): void {
    SceneCommunicatorService.setup();
    const gameSessionInstance = new ProbableWaffleGameInstance({
      gameModeData: {
        level: ProbableWaffleLevels[ProbableWaffleLevelEnum.EmberEnclave] // todo read this from ID
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
