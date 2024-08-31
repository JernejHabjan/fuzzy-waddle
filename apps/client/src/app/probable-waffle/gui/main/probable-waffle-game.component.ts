import { Component, inject, OnInit } from "@angular/core";
import { ProbableWaffleGameInstance, ProbableWaffleUserInfo } from "@fuzzy-waddle/api-interfaces";
import { BaseGameData } from "../../../shared/game/phaser/game/base-game-data";
import { ProbableWaffleCommunicatorService } from "../../communicators/probable-waffle-communicator.service";
import { AuthService } from "../../../auth/auth.service";
import { probableWaffleGameConfig } from "../../game/world/const/game-config";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { GameContainerComponent } from "../../../shared/game/game-container/game-container.component";

@Component({
  templateUrl: "./probable-waffle-game.component.html",
  styleUrls: ["./probable-waffle-game.component.scss"],
  standalone: true,
  imports: [GameContainerComponent]
})
export class ProbableWaffleGameComponent implements OnInit {
  protected readonly probableWaffleGameConfig = probableWaffleGameConfig;
  protected gameData?: BaseGameData<
    ProbableWaffleCommunicatorService,
    ProbableWaffleGameInstance,
    ProbableWaffleUserInfo
  >;

  private readonly gameInstanceClientService = inject(GameInstanceClientService);
  private readonly communicatorService = inject(ProbableWaffleCommunicatorService);
  private readonly authService = inject(AuthService);

  ngOnInit(): void {
    const gameInstance = this.gameInstanceClientService.gameInstance;
    if (!gameInstance) return;
    this.gameData = {
      gameInstance,
      communicator: this.communicatorService,
      user: new ProbableWaffleUserInfo(this.authService.userId, this.gameInstanceClientService.currentPlayerNumber)
    } as const;
  }
}
