import { ChangeDetectorRef, Component, inject, type OnDestroy, type OnInit } from "@angular/core";
import { ProbableWaffleGameInstance, ProbableWaffleUserInfo } from "@fuzzy-waddle/api-interfaces";
import { BaseGameData } from "../../../shared/game/phaser/game/base-game-data";
import { ProbableWaffleCommunicatorService } from "../../communicators/probable-waffle-communicator.service";
import { AuthService } from "../../../auth/auth.service";
import { probableWaffleGameConfig } from "../../game/world/const/game-config";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { GameContainerComponent } from "../../../shared/game/game-container/game-container.component";
import { AngularHost } from "../../../shared/consts";
import { Subscription } from "rxjs";
import { OptionsService } from "../options/options.service";
import { AchievementService } from "../../services/achievement/achievement.service";

@Component({
  templateUrl: "./probable-waffle-game.component.html",
  styleUrls: ["./probable-waffle-game.component.scss"],
  imports: [GameContainerComponent],
  host: AngularHost.contentFlexFullHeight
})
export class ProbableWaffleGameComponent implements OnInit, OnDestroy {
  protected readonly probableWaffleGameConfig = probableWaffleGameConfig;
  protected gameData?: BaseGameData<
    ProbableWaffleCommunicatorService,
    ProbableWaffleGameInstance,
    ProbableWaffleUserInfo
  >;

  private readonly gameInstanceClientService = inject(GameInstanceClientService);
  private readonly communicatorService = inject(ProbableWaffleCommunicatorService);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly optionsService = inject(OptionsService);
  private readonly achievementService = inject(AchievementService);
  private refreshSubscription?: Subscription;

  ngOnInit(): void {
    this.setData();

    this.refreshSubscription = this.gameInstanceClientService.gameInstanceToGameComponentCommunicator.subscribe(
      (data) => {
        if (data === "refresh") {
          this.gameData = undefined;
          this.cdr.detectChanges();
          setTimeout(() => {
            this.setData();
            this.cdr.detectChanges();
          }, 50);
        }
      }
    );
  }

  private setData() {
    const gameInstance = this.gameInstanceClientService.gameInstance;
    if (!gameInstance) return;
    this.gameData = {
      gameInstance,
      communicator: this.communicatorService,
      components: [this.optionsService, this.achievementService],
      user: new ProbableWaffleUserInfo(this.authService.userId, this.gameInstanceClientService.currentPlayerNumber)
    } as const;
  }
  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }
}
