import { Component, Input, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { flySquasherGameConfig } from "../game/consts/game-config";
import { FlySquasherGameInstance, FlySquasherLevels, FlySquasherUserInfo } from "@fuzzy-waddle/api-interfaces";
import { AuthService } from "../../auth/auth.service";
import { FlySquasherGameData } from "../game/fly-squasher-game-data";
import { FlySquasherCommunicatorService } from "../game/fly-squasher-communicator.service";
import { SceneCommunicatorClientService } from "./scene-communicator-client.service";
import { Router } from "@angular/router";
import { PreventNavigateBack } from "../../shared/handlers/prevent-navigate-back";
import { ModalConfig } from "../../shared/components/modal/modal-config";
import { ModalComponent } from "../../shared/components/modal/modal.component";

@Component({
  templateUrl: "./main.component.html",
  styleUrls: ["./main.component.scss"]
})
export class MainComponent implements OnInit, OnDestroy {
  @ViewChild("modal") private modalComponent!: ModalComponent;
  protected readonly flySquasherGameConfig = flySquasherGameConfig;
  protected gameData!: FlySquasherGameData;
  @Input({ required: true }) level!: string;
  private preventNavigateBack = new PreventNavigateBack(this.router);
  protected leaveModalConfirm: ModalConfig = {
    modalTitle: "Leave the game?",
    dismissButtonLabel: "Continue",
    closeButtonLabel: "Leave",
    onClose: async () => this.preventNavigateBack.navigateBack()
  };
  constructor(
    private readonly authService: AuthService,
    private readonly communicatorService: FlySquasherCommunicatorService,
    private readonly sceneCommunicatorClientService: SceneCommunicatorClientService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    const levelData = Object.values(FlySquasherLevels).find((level) => level.id === Number.parseInt(this.level))!;

    const gameSessionInstance = new FlySquasherGameInstance({
      gameModeData: {
        level: levelData
      }
    });
    this.gameData = {
      gameInstance: gameSessionInstance,
      communicator: this.communicatorService,
      user: new FlySquasherUserInfo(this.authService.userId)
    };
    this.sceneCommunicatorClientService.startCommunication();
  }

  protected async leave() {
    await this.openModal();
  }

  private async openModal() {
    return await this.modalComponent.open();
  }

  ngOnDestroy(): void {
    this.sceneCommunicatorClientService.stopCommunication();
  }
}
