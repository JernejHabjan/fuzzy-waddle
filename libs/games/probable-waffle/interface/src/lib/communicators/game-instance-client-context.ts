import { inject, Injectable, NgZone } from "@angular/core";
import { Subject, Subscription } from "rxjs";
import { HttpClient } from "@angular/common/http";
import {
  type ProbableWaffleDataChangeEventProperty,
  ProbableWaffleGameInstance,
  type ProbableWaffleGameInstanceMetadataData,
  ProbableWaffleGameInstanceType
} from "@fuzzy-waddle/probable-waffle-protocol";
import { type GameInstanceId, type PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import { ServerHealthService } from "@fuzzy-waddle/platform-game-host/angular/services/server-health.service";
import { SceneCommunicatorClientService } from "./scene-communicator-client.service";
import { AuthService } from "@fuzzy-waddle/platform-identity/client/auth/auth.service";
import { CurrentUserProfileService } from "@fuzzy-waddle/platform-identity/client/profile-data/current-user-profile.service";
import { Router } from "@angular/router";
import { ProbableWaffleCommunicatorService } from "./probable-waffle-communicator.service";
import { AuthenticatedSocketService } from "@fuzzy-waddle/platform-chat/client/data-access/authenticated-socket.service";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import type { SaveGamePayload } from "@fuzzy-waddle/probable-waffle-phaser/data/save-game-payload";
import type { ProbableWaffleCommunicators } from "./probable-waffle.communicators";
import { GameSaveService } from "../services/game-save/game-save.service";
import { ToastService } from "@fuzzy-waddle/platform-game-host/angular/services/toast.service";

/** Shared instance/dependency lifetime. Only GameInstanceClientService is a root provider; all layers use one object. */
@Injectable()
export abstract class GameInstanceClientContext {
  protected readonly DEBUG = false;
  gameInstance?: ProbableWaffleGameInstance;
  /**
   * used to track which player number are we in the game
   */
  currentPlayerNumber?: PlayerNumber;

  protected readonly authService = inject(AuthService);
  protected readonly currentUserProfileService = inject(CurrentUserProfileService);
  protected readonly httpClient = inject(HttpClient);
  protected readonly serverHealthService = inject(ServerHealthService);
  protected readonly sceneCommunicatorClientService = inject(SceneCommunicatorClientService);
  protected readonly probableWaffleCommunicatorService = inject(ProbableWaffleCommunicatorService);
  protected readonly authenticatedSocketService = inject(AuthenticatedSocketService);
  protected readonly gameSaveService = inject(GameSaveService);
  protected readonly modalService = inject(NgbModal);
  protected readonly router = inject(Router);
  protected readonly ngZone = inject(NgZone);
  protected readonly toastService = inject(ToastService);
  protected communicators?: ProbableWaffleCommunicators;
  protected communicatorSubscriptions: Subscription[] = [];
  /** The binding owns its original identity even if gameInstance already points to the next match. */
  protected communicatorInstanceId?: GameInstanceId;
  protected communicatorUsesServer = false;
  protected eventBindingGeneration = 0;
  protected externalModalOpen = false;
  protected externalModalRef?: NgbModalRef;
  protected selfExitInProgress = false;
  protected autosaveTimer?: ReturnType<typeof setInterval>;
  protected lastCheckpointAutosave?: { checkpointId: string; savedAt: number };
  gameInstanceToGameComponentCommunicator = new Subject<"refresh">();

  get currentGameInstanceId(): string | null {
    return this.gameInstance?.gameInstanceMetadata?.data.gameInstanceId ?? null;
  }

  protected async cleanupLocalGameState(): Promise<void> {
    const original = this.gameInstance;
    await this.stopListeningToGameInstanceEvents();
    if (this.gameInstance !== original) return;
    this.gameInstance = undefined;
    this.currentPlayerNumber = undefined;
    this.selfExitInProgress = false;
  }

  protected syncCurrentPlayerNumberFromGameInstance(): void {
    if (!this.authService.userId) {
      this.currentPlayerNumber = undefined;
      return;
    }

    this.currentPlayerNumber = this.gameInstance?.players.find(
      (player) => player.playerController.data.userId === this.authService.userId
    )?.playerNumber;
  }

  protected getNormalizedGameInstanceType(): ProbableWaffleGameInstanceType | undefined {
    const rawType = this.gameInstance?.gameInstanceMetadata?.data.type;
    return rawType ?? undefined;
  }

  protected async handleSelfRemovedFromGameInstance(): Promise<void> {
    await this.cleanupLocalGameState();
    if (this.gameInstance) return;
    await this.ngZone.run(async () => {
      await this.router.navigate(["aota"]);
    });
  }

  protected shouldUseServerTransportForCurrentGame(): boolean {
    switch (this.getNormalizedGameInstanceType()) {
      case ProbableWaffleGameInstanceType.SelfHosted:
      case ProbableWaffleGameInstanceType.Matchmaking:
        return true;
      case ProbableWaffleGameInstanceType.Skirmish:
      case ProbableWaffleGameInstanceType.Campaign:
      case ProbableWaffleGameInstanceType.InstantGame:
      case ProbableWaffleGameInstanceType.Replay:
        return false;
      default:
        return false;
    }
  }
  abstract gameInstanceMetadataChanged(
    property: ProbableWaffleDataChangeEventProperty<ProbableWaffleGameInstanceMetadataData>,
    data: Partial<ProbableWaffleGameInstanceMetadataData>
  ): Promise<void>;
  abstract saveGameInstance(data: SaveGamePayload): Promise<void>;
  abstract closeExternalModal(): void;
  protected abstract stopListeningToGameInstanceEvents(): Promise<void>;
}
