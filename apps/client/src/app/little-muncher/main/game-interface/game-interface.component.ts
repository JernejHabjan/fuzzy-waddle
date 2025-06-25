import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from "@angular/core";
import { ModalConfig } from "../../../shared/components/modal/modal-config";
import { Subscription } from "rxjs";
import { faPause, faPlay } from "@fortawesome/free-solid-svg-icons";
import { AuthService } from "../../../auth/auth.service";
import { LittleMuncherHillEnum, LittleMuncherHills } from "@fuzzy-waddle/api-interfaces";
import { PreventNavigateBack } from "../../../shared/handlers/prevent-navigate-back";
import { Router } from "@angular/router";
import { GameInstanceClientService } from "../communicators/game-instance-client.service";
import { LittleMuncherCommunicatorService } from "../communicators/little-muncher-communicator.service";

import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { WrapPipe } from "../../../shared/pipes/wrap.pipe";
import { LeaveButtonComponent } from "../../../shared/components/leave-button.component";

@Component({
  selector: "little-muncher-game-interface",
  templateUrl: "./game-interface.component.html",
  styleUrls: ["./game-interface.component.scss"],
  imports: [FaIconComponent, WrapPipe, LeaveButtonComponent]
})
export class GameInterfaceComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly gameInstanceClientService = inject(GameInstanceClientService);
  private readonly communicatorService = inject(LittleMuncherCommunicatorService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  protected score = 0;
  protected remaining = 0;
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
    const hill = this.gameInstanceClientService.gameInstance?.gameMode?.data.hill;
    const gameState = this.gameInstanceClientService.gameInstance?.gameState;
    if (!hill || !gameState) {
      return;
    }
    // set initial remaining:
    this.remaining = this.getRemaining(hill, gameState.data.climbedHeight);
    this.scoreSubscription = this.communicatorService.timeClimbing?.on.subscribe((event) => {
      if (!this.gameInstanceClientService.gameInstance?.gameMode?.data.hill) {
        return;
      }
      this.remaining = this.getRemaining(hill, event.timeClimbing);
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
