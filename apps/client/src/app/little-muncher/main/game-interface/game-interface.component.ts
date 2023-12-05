import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { ModalConfig } from "../../../shared/components/modal/modal-config";
import { ModalComponent } from "../../../shared/components/modal/modal.component";
import { GameInstanceClientService } from "../game-instance-client.service";
import { LittleMuncherCommunicatorService } from "../../game/little-muncher-communicator.service";
import { Subscription } from "rxjs";
import { faPause, faPlay } from "@fortawesome/free-solid-svg-icons";
import { AuthService } from "../../../auth/auth.service";
import { LittleMuncherHillEnum, LittleMuncherHills } from "@fuzzy-waddle/api-interfaces";
import { PreventNavigateBack } from "../../../shared/handlers/prevent-navigate-back";
import { Router } from "@angular/router";

@Component({
  selector: "fuzzy-waddle-game-interface",
  templateUrl: "./game-interface.component.html",
  styleUrls: ["./game-interface.component.scss"]
})
export class GameInterfaceComponent implements OnInit, OnDestroy {
  score = 0;
  remaining = 0;
  @ViewChild("modal") private modalComponent!: ModalComponent;
  protected readonly faPause = faPause;
  protected readonly faPlay = faPlay;
  protected paused = false;
  protected isPlayer = false;
  private preventNavigateBack = new PreventNavigateBack(this.router);
  protected readonly leaveModalConfirm: ModalConfig = {
    modalTitle: "Leave the game?",
    dismissButtonLabel: "Continue",
    closeButtonLabel: "Leave",
    onClose: async () =>
      await this.gameInstanceClientService
        .stopLevel("localAndRemote")
        .then(() => this.preventNavigateBack.allowNavigateBack())
  };
  private scoreSubscription?: Subscription;
  private pauseSubscription?: Subscription;

  constructor(
    private readonly authService: AuthService,
    private readonly gameInstanceClientService: GameInstanceClientService,
    private readonly communicatorService: LittleMuncherCommunicatorService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly router: Router
  ) {}

  protected async leave() {
    await this.openModal();
  }

  protected async openModal() {
    return await this.modalComponent.open();
  }

  ngOnInit(): void {
    this.manageUiElementVisibility();
    this.manageScore();
    this.manageRemaining();
    this.managePause();
  }

  private manageUiElementVisibility() {
    if (!this.gameInstanceClientService.gameInstance) {
      return;
    }
    this.isPlayer = this.gameInstanceClientService.gameInstance.isPlayer(this.authService.userId);
  }

  private manageScore() {
    if (!this.gameInstanceClientService.gameInstance?.players.length) {
      return;
    }
    // set initial score:
    this.score = this.gameInstanceClientService.gameInstance.players[0].playerState.data.score;
    this.scoreSubscription = this.communicatorService.score?.on.subscribe((event) => {
      this.score = event.score;
      this.changeDetectorRef.detectChanges();
    });
  }

  private manageRemaining() {
    if (
      !this.gameInstanceClientService.gameInstance?.gameMode?.data.hill ||
      !this.gameInstanceClientService.gameInstance?.gameState
    ) {
      return;
    }
    // set initial remaining:
    this.remaining = this.getRemaining(
      this.gameInstanceClientService.gameInstance.gameMode.data.hill,
      this.gameInstanceClientService.gameInstance.gameState.data.climbedHeight
    );
    this.scoreSubscription = this.communicatorService.timeClimbing?.on.subscribe((event) => {
      if (!this.gameInstanceClientService.gameInstance?.gameMode?.data.hill) {
        return;
      }
      this.remaining = this.getRemaining(
        this.gameInstanceClientService.gameInstance.gameMode.data.hill,
        event.timeClimbing
      );
      this.changeDetectorRef.detectChanges();
    });
  }

  private getRemaining(hillType: LittleMuncherHillEnum, timeClimbing: number): number {
    const hill = LittleMuncherHills[hillType];
    const res = hill.height - timeClimbing;
    return res >= 0 ? res : 0;
  }

  private managePause() {
    if (!this.gameInstanceClientService.gameInstance?.gameState) {
      return;
    }
    // set initial pause:
    this.paused = this.gameInstanceClientService.gameInstance.gameState.data.pause;
    this.pauseSubscription = this.communicatorService.pause?.on.subscribe((event) => {
      this.paused = event.pause;
      this.changeDetectorRef.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.scoreSubscription?.unsubscribe();
    this.pauseSubscription?.unsubscribe();
  }

  protected pauseToggle() {
    this.paused = !this.paused;
    this.communicatorService.pause?.send({ pause: this.paused });
  }
}
