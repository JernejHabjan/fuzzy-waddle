import { Component, inject, type OnDestroy, type OnInit, input } from "@angular/core";
import { flySquasherGameConfig } from "@fuzzy-waddle/fly-squasher-gameplay/consts/game-config";
import { FlySquasherGameInstance, FlySquasherLevels, FlySquasherUserInfo } from "@fuzzy-waddle/api-interfaces";
import { AuthService } from "@fuzzy-waddle/portal/auth/auth.service";
import { type FlySquasherGameData } from "@fuzzy-waddle/fly-squasher-gameplay/fly-squasher-game-data";
import { FlySquasherCommunicatorService } from "@fuzzy-waddle/fly-squasher-gameplay/fly-squasher-communicator.service";
import { SceneCommunicatorClientService } from "./scene-communicator-client.service";
import { Router } from "@angular/router";
import { PreventNavigateBack } from "@fuzzy-waddle/portal/shared/handlers/prevent-navigate-back";
import { type ModalConfig } from "@fuzzy-waddle/portal/shared/components/modal/modal-config";

import { GameContainerComponent } from "@fuzzy-waddle/platform-game-host/game-container/game-container.component";
import { AngularHost } from "@fuzzy-waddle/portal/shared/consts";
import { LeaveButtonComponent } from "@fuzzy-waddle/portal/shared/components/leave-button/leave-button.component";

@Component({
  templateUrl: "./main.component.html",
  styleUrls: ["./main.component.scss"],
  imports: [GameContainerComponent, LeaveButtonComponent],
  host: AngularHost.contentFlexFullHeight
})
export class MainComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly communicatorService = inject(FlySquasherCommunicatorService);
  private readonly sceneCommunicatorClientService = inject(SceneCommunicatorClientService);
  private readonly router = inject(Router);

  protected readonly flySquasherGameConfig = flySquasherGameConfig;
  protected gameData!: FlySquasherGameData;
  readonly level = input.required<string>();
  private preventNavigateBack = new PreventNavigateBack(this.router);
  protected leaveModalConfirm: ModalConfig = {
    modalTitle: "Leave the game?",
    dismissButtonLabel: "Continue",
    closeButtonLabel: "Leave",
    onClose: async () => this.preventNavigateBack.navigateBack()
  };

  ngOnInit(): void {
    const levelData = Object.values(FlySquasherLevels).find((level) => level.id === Number.parseInt(this.level()))!;

    const gameSessionInstance = new FlySquasherGameInstance({
      gameModeData: {
        level: levelData
      }
    });
    this.gameData = {
      gameInstance: gameSessionInstance,
      communicator: this.communicatorService,
      components: [],
      user: new FlySquasherUserInfo(this.authService.userId)
    };
    this.sceneCommunicatorClientService.startCommunication();
  }

  ngOnDestroy(): void {
    this.sceneCommunicatorClientService.stopCommunication();
  }
}
