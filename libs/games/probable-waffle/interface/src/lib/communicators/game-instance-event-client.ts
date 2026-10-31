import { Injectable } from "@angular/core";
import { filter, firstValueFrom } from "rxjs";
import { environment } from "@fuzzy-waddle/environments/environment";
import {
  type DifficultyModifiers,
  type MapTuning,
  ProbableWaffleGameInstance,
  type ProbableWaffleGameInstanceMetadataData,
  ProbableWaffleGameInstanceType,
  ProbableWaffleGameInstanceVisibility,
  type ProbableWaffleGameModeData,
  type ProbableWaffleGameStateData,
  ProbableWaffleListeners,
  ProbableWafflePlayerType
} from "@fuzzy-waddle/probable-waffle-protocol";
import { GameSessionState } from "@fuzzy-waddle/platform-game-sessions";
import { NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { LoadComponent } from "../gui/load/load.component";
import { OptionsComponent } from "../gui/options/options.component";
import { InGameChatComponent } from "../gui/in-game-chat/in-game-chat.component";
import { GameInstanceClientContext } from "./game-instance-client-context";
/** Owns communicator subscriptions, modal event routing and autosave lifetime for one instance. */
@Injectable()
export abstract class GameInstanceEventClient extends GameInstanceClientContext {
  async createGameInstance(
    name: string,
    visibility: ProbableWaffleGameInstanceVisibility,
    type: ProbableWaffleGameInstanceType
  ): Promise<void> {
    this.gameInstance = new ProbableWaffleGameInstance({
      gameInstanceMetadataData: {
        name,
        createdBy: this.authService.userId,
        currentHostUserId: this.authService.userId,
        type,
        visibility,
        startOptions: {},
        rndSeed: Math.floor(Math.random() * 1000000)
      } satisfies ProbableWaffleGameInstanceMetadataData,
      gameModeData: {
        tieConditions: {
          maximumTimeLimitInMinutes: 60
        },
        winConditions: {
          noEnemyPlayersLeft: true
        },
        loseConditions: {
          allBuildingsMustBeEliminated: true
        },
        mapTuning: { unitCap: 100 } satisfies MapTuning,
        difficultyModifiers: {} satisfies DifficultyModifiers
      } satisfies ProbableWaffleGameModeData,
      gameStateData: {} as ProbableWaffleGameStateData
    });
    this.syncCurrentPlayerNumberFromGameInstance();
    if (this.authService.isAuthenticated && this.serverHealthService.serverAvailable) {
      const url = environment.api + "api/probable-waffle/start-game";
      const body: ProbableWaffleGameInstanceMetadataData = this.gameInstance.gameInstanceMetadata!.data;
      await firstValueFrom(this.httpClient.post<void>(url, body));
    }

    await this.startListeningToGameInstanceEvents();
  }

  async stopGameInstance(): Promise<void> {
    await this.gameInstanceMetadataChanged("sessionState", { sessionState: GameSessionState.Stopped });
  }

  listenToGameInstanceMetadataEvents(): void {
    if (!this.communicators) return;
    this.communicatorSubscriptions.push(
      this.communicators.gameInstanceObservable.subscribe(async (payload) => {
        const instance = this.gameInstance;
        if (payload.gameInstanceId !== this.currentGameInstanceId) return;
        ProbableWaffleListeners.gameInstanceMetadataChanged(instance, payload);
        switch (payload.property) {
          case "sessionState":
            switch (payload.data.sessionState) {
              case GameSessionState.MovingPlayersToGame:
                await this.router.navigate(["aota/game"]);
                break;
              case GameSessionState.ToScoreScreen:
                await this.ngZone.run(async () => {
                  await this.router.navigate(["aota/score-screen"]);
                });
                break;
              case GameSessionState.Stopped:
                await this.stopListeningToGameInstanceEvents();
                if (this.gameInstance === instance) this.gameInstance = undefined;
                console.log("removed game instance");
                break;
            }
            break;
        }
      })
    );
  }

  /**
   * Subscribes to utility events that keep the client-side game instance synchronized with remote lifecycle changes.
   * It narrows each event, refreshes local authority, and avoids applying campaign/save updates to an unrelated instance.
   */
  listenToUtilityGameEvents(): void {
    this.communicatorSubscriptions.push(
      this.probableWaffleCommunicatorService.utilityEvents
        .pipe(
          filter(
            (config) =>
              config.name === "save-game" ||
              config.name === "save-game-rejected" ||
              config.name === "campaign-restore-failed" ||
              config.name === "load-game" ||
              config.name === "settings" ||
              config.name === "chat"
          )
        )
        .subscribe(async (payload) => {
          let modalRef: NgbModalRef | undefined;
          switch (payload.name) {
            case "save-game":
              if (this.DEBUG) {
                console.log("save game requested", payload.data);
              }
              await this.saveGameInstance(payload.data);
              break;
            case "save-game-rejected":
              this.toastService.showWarning(
                "Save unavailable",
                payload.data?.reason ?? "The mission cannot be saved yet."
              );
              break;
            case "campaign-restore-failed":
              this.toastService.showWarning(
                "Save recovery required",
                `${payload.data?.issues?.join(" ") ??
                  "The save could not be restored safely."} Try an earlier autosave or restart the mission.`
              );
              break;
            case "load-game":
              if (this.DEBUG) {
                console.log("load game requested", payload.data);
              }
              modalRef = this.modalService.open(LoadComponent, {
                size: "lg",
                scrollable: true,
                centered: true,
                modalDialogClass: "transparent-modal"
              });
              (modalRef.componentInstance as LoadComponent).fromGame = true;
              (modalRef.componentInstance as LoadComponent).dialogRef = modalRef;
              (modalRef.componentInstance as LoadComponent).scopeFilter =
                this.getNormalizedGameInstanceType() === ProbableWaffleGameInstanceType.Campaign
                  ? "campaign"
                  : "skirmish";
              (modalRef.componentInstance as LoadComponent).missionScopeId =
                this.gameInstance?.gameInstanceMetadata.data.campaignContext?.missionId;
              break;
            case "settings":
              if (this.DEBUG) {
                console.log("settings requested", payload.data);
              }
              modalRef = this.modalService.open(OptionsComponent, {
                size: "lg",
                scrollable: true,
                centered: true,
                modalDialogClass: "transparent-modal"
              });
              (modalRef.componentInstance as OptionsComponent).fromGame = true;
              (modalRef.componentInstance as OptionsComponent).dialogRef = modalRef;
              break;
            case "chat":
              if (this.DEBUG) {
                console.log("chat requested", payload.data);
              }
              this.externalModalOpen = true;
              this.probableWaffleCommunicatorService.allScenes.emit({
                name: "external-modal-opened",
                data: undefined
              });
              modalRef = this.modalService.open(InGameChatComponent, {
                size: "md",
                scrollable: true,
                centered: true,
                modalDialogClass: "transparent-modal"
              });
              this.externalModalRef = modalRef;
              (modalRef.componentInstance as InGameChatComponent).fromGame = true;
              (modalRef.componentInstance as InGameChatComponent).dialogRef = modalRef;
              modalRef.result.finally(() => {
                this.externalModalOpen = false;
                this.externalModalRef = undefined;
                this.probableWaffleCommunicatorService.allScenes.emit({
                  name: "external-modal-closed",
                  data: undefined
                });
              });
              break;
          }
        })
    );
  }

  listenToChatMessagesForNotifications(): void {
    const subscription = this.probableWaffleCommunicatorService.message?.on.subscribe((msg) => {
      // Only show notification in Phaser HUD when chat modal is closed
      if (!this.externalModalOpen && msg.chatMessage) {
        // Emit to Phaser scene to show notification
        this.probableWaffleCommunicatorService.allScenes.emit({
          name: "chat-message-received",
          data: msg.chatMessage
        });
      }
    });
    if (subscription) {
      this.communicatorSubscriptions.push(subscription);
    }
  }

  listenToSceneShutdown(): void {
    const subscription = this.probableWaffleCommunicatorService.allScenes.subscribe((event) => {
      if (event.name === "hud-scene-shutdown") {
        // Close chat modal when HUD scene shuts down
        this.closeExternalModal();
      }
    });
    this.communicatorSubscriptions.push(subscription);
  }

  listenToGameModeDataEvents(): void {
    if (!this.communicators) return;
    this.communicatorSubscriptions.push(
      this.communicators.gameModeObservable.subscribe((payload) =>
        ProbableWaffleListeners.gameModeChanged(this.gameInstance, payload)
      )
    );
  }

  listenToPlayerEvents(): void {
    if (!this.communicators) return;
    this.communicatorSubscriptions.push(
      this.communicators.playerObservable.subscribe((payload) => {
        ProbableWaffleListeners.playerChanged(this.gameInstance, payload);
        let currentUserHasJoined = false;
        switch (payload.property) {
          case "joined":
            currentUserHasJoined =
              // offline
              (!this.authService.userId &&
                payload.data.playerControllerData!.playerDefinition!.playerType === ProbableWafflePlayerType.Human) ||
              // logged in
              (!!this.authService.userId && payload.data.playerControllerData!.userId === this.authService.userId);
            if (currentUserHasJoined) {
              this.currentPlayerNumber = payload.data.playerControllerData!.playerDefinition!.player.playerNumber;
            }
            break;
          case "joinedFromNetwork":
            const player = this.gameInstance!.players.find(
              (p) => p.playerController.data.userId === this.authService.userId
            );
            if (player) {
              this.currentPlayerNumber = player.playerNumber;
            }
            break;
          case "left":
            if (payload.data.playerControllerData!.playerDefinition!.player.playerNumber === this.currentPlayerNumber) {
              this.currentPlayerNumber = undefined;
              if (!this.selfExitInProgress) {
                this.handleSelfRemovedFromGameInstance().catch((error: unknown) => {
                  console.error("[GameInstanceClientService] Failed to handle self removal:", error);
                });
              }
            }
            break;
        }
      })
    );
  }

  listenToSpectatorEvents(): void {
    if (!this.communicators) return;
    this.communicatorSubscriptions.push(
      this.communicators.spectatorObservable.subscribe((payload) =>
        ProbableWaffleListeners.spectatorChanged(this.gameInstance, payload)
      )
    );
  }

  listenToGameStateChangedEvents(): void {
    if (!this.communicators) return;
    this.communicatorSubscriptions.push(
      this.communicators.gameStateObservable.subscribe((payload) => {
        if (this.DEBUG) {
          console.log("game state changed on client", payload);
        }
      })
    );
  }

  protected async startListeningToGameInstanceEvents() {
    const instance = this.gameInstance, instanceId = this.currentGameInstanceId;
    if (!instanceId)
      throw new Error("Game instance not found in startListeningToGameInstanceEvents in GameInstanceClientService");
    await this.stopListeningToGameInstanceEvents();
    if (this.gameInstance !== instance) return;
    const generation = ++this.eventBindingGeneration, server = this.shouldUseServerTransportForCurrentGame();
    this.communicatorInstanceId = instanceId;
    this.communicatorUsesServer = server;
    const communicators = await this.sceneCommunicatorClientService.createCommunicators(instanceId, server);
    if (generation !== this.eventBindingGeneration || this.gameInstance !== instance) return;
    this.communicators = communicators;
    this.listenToGameInstanceMetadataEvents();
    this.listenToGameModeDataEvents();
    this.listenToPlayerEvents();
    this.listenToSpectatorEvents();
    this.listenToGameStateChangedEvents();
    this.listenToUtilityGameEvents();
    this.listenToChatMessagesForNotifications();
    this.listenToSceneShutdown();
    this.startAutosaveTimer();
  }

  protected async stopListeningToGameInstanceEvents() {
    ++this.eventBindingGeneration;
    const instanceId = this.communicatorInstanceId, server = this.communicatorUsesServer;
    const subscriptions = this.communicatorSubscriptions.splice(0);
    subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.communicatorInstanceId = undefined;
    this.communicators = undefined;
    this.stopAutosaveTimer();
    this.lastCheckpointAutosave = undefined;
    if (!instanceId) return;
    await this.sceneCommunicatorClientService.destroyCommunicators(
      instanceId, subscriptions, server
    );
  }

  /** Documents the start autosave timer member and its declared contract at this boundary. */
  protected startAutosaveTimer(): void {
    this.stopAutosaveTimer();
    const type = this.getNormalizedGameInstanceType();
    if (type !== ProbableWaffleGameInstanceType.Campaign && type !== ProbableWaffleGameInstanceType.Skirmish) return;
    this.autosaveTimer = setInterval(
      () => {
        this.probableWaffleCommunicatorService.allScenes.emit({ name: "save-game", data: { kind: "autosave" } });
      },
      10 * 60 * 1000
    );
  }

  protected stopAutosaveTimer(): void {
    if (this.autosaveTimer) clearInterval(this.autosaveTimer);
    this.autosaveTimer = undefined;
  }

  requestCheckpointAutosave(checkpointId: string): void {
    const now = Date.now();
    if (
      this.lastCheckpointAutosave?.checkpointId === checkpointId &&
      now - this.lastCheckpointAutosave.savedAt < 60_000
    )
      return;
    this.lastCheckpointAutosave = { checkpointId, savedAt: now };
    this.probableWaffleCommunicatorService.allScenes.emit({
      name: "save-game",
      data: { kind: "autosave", checkpointId }
    });
  }

}
