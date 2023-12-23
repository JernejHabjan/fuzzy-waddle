import { Component, HostListener, inject, OnDestroy, OnInit } from "@angular/core";
import { ProbableWaffleGameInstance, ProbableWaffleUserInfo } from "@fuzzy-waddle/api-interfaces";
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
  protected readonly drawerWidth = "150px";
  protected displayDrawers = true; // todo
  protected gameData?: BaseGameData<
    ProbableWaffleCommunicatorService,
    ProbableWaffleGameInstance,
    ProbableWaffleUserInfo
  >;

  private readonly gameInstanceClientService = inject(GameInstanceClientService);
  private readonly communicatorService = inject(ProbableWaffleCommunicatorService);
  private readonly authService = inject(AuthService);

  ngOnDestroy(): void {
    SceneCommunicatorService.unsubscribe();
  }

  ngOnInit(): void {
    SceneCommunicatorService.setup();
    const gameInstance = this.gameInstanceClientService.gameInstance;
    if (!gameInstance) return;
    this.gameData = {
      gameInstance,
      communicator: this.communicatorService,
      user: new ProbableWaffleUserInfo(this.authService.userId)
    } as const;

    // todo properly listen with communicatorService

    this.onResize({ target: window });
  }

  // register window resize event
  @HostListener("window:resize", ["$event"])
  onResize(event: { target: { innerWidth: number } }) {
    if (event.target.innerWidth < 800) {
      this.displayDrawers = false;
    } else {
      this.displayDrawers = true;
    }
  }
}
