import { inject, Injectable, NgZone } from "@angular/core";
import { filter, firstValueFrom, Observable, Subject, Subscription } from "rxjs";
import { environment } from "../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import {
  createPlayerLobbyDefinition,
  type DifficultyModifiers,
  type GameInstanceId,
  GameSessionState,
  GameSetupHelpers,
  getRandomFactionType,
  type MapTuning,
  type PlayerLobbyDefinition,
  type PlayerNumber,
  type PositionPlayerDefinition,
  ProbableWaffleAiDifficulty,
  type ProbableWaffleDataChangeEventProperty,
  type ProbableWaffleGameFoundEvent,
  ProbableWaffleGameInstance,
  type ProbableWaffleGameInstanceData,
  ProbableWaffleGameInstanceEvent,
  type ProbableWaffleGameInstanceMetadataData,
  type ProbableWaffleGameInstanceSaveData,
  ProbableWaffleGameInstanceType,
  ProbableWaffleGameInstanceVisibility,
  type ProbableWaffleGameModeData,
  type ProbableWaffleGameStateData,
  ProbableWaffleListeners,
  type ProbableWafflePlayerDataChangeEventPayload,
  type ProbableWafflePlayerDataChangeEventProperty,
  ProbableWafflePlayerType,
  type ProbableWaffleSpectatorData,
  type ProbableWaffleSpectatorDataChangeEventProperty,
  type RequestGameSearchForMatchMakingDto
} from "@fuzzy-waddle/api-interfaces";
import { ServerHealthService } from "../../shared/services/server-health.service";
import { SceneCommunicatorClientService } from "./scene-communicator-client.service";
import { AuthService } from "../../auth/auth.service";
import { type GameInstanceClientServiceInterface } from "./game-instance-client.service.interface";
import { Router } from "@angular/router";
import { ProbableWaffleCommunicatorService } from "./probable-waffle-communicator.service";
import { map } from "rxjs/operators";
import { AuthenticatedSocketService } from "../../data-access/chat/authenticated-socket.service";
import { GameInstanceStorageServiceInterface } from "./storage/game-instance-storage.service.interface";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { LoadComponent } from "../gui/load/load.component";
import { OptionsComponent } from "../gui/options/options.component";
import { InGameChatComponent } from "../gui/in-game-chat/in-game-chat.component";
import type { SaveGamePayload } from "../game/data/save-game-payload";
import type { ProbableWaffleCommunicators } from "./probable-waffle.communicators";
import type { MatchmakingOptions } from "../gui/online/matchmaking/matchmaking-options";

@Injectable({
  providedIn: "root"
})
export class GameInstanceClientService implements GameInstanceClientServiceInterface {
  private readonly DEBUG = false;
  gameInstance?: ProbableWaffleGameInstance;
  /**
   * used to track which player number are we in the game
   */
  currentPlayerNumber?: PlayerNumber;

  private readonly authService = inject(AuthService);
  private readonly httpClient = inject(HttpClient);
  private readonly serverHealthService = inject(ServerHealthService);
  private readonly sceneCommunicatorClientService = inject(SceneCommunicatorClientService);
  private readonly probableWaffleCommunicatorService = inject(ProbableWaffleCommunicatorService);
  private readonly authenticatedSocketService = inject(AuthenticatedSocketService);
  private readonly gameInstanceStorageService = inject(GameInstanceStorageServiceInterface);
  private readonly modalService = inject(NgbModal);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);
  private communicators?: ProbableWaffleCommunicators;
  private communicatorSubscriptions: Subscription[] = [];
  private externalModalOpen = false;
  private externalModalRef?: NgbModalRef;
  private selfExitInProgress = false;
  gameInstanceToGameComponentCommunicator = new Subject<"refresh">();

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
        ProbableWaffleListeners.gameInstanceMetadataChanged(this.gameInstance, payload);
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
                this.gameInstance = undefined;
                console.log("removed game instance");
                break;
            }
            break;
        }
      })
    );
  }

  listenToUtilityGameEvents(): void {
    this.communicatorSubscriptions.push(
      this.probableWaffleCommunicatorService.utilityEvents
        .pipe(
          filter(
            (config) =>
              config.name === "save-game" ||
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

  private async startListeningToGameInstanceEvents() {
    if (!this.currentGameInstanceId)
      throw new Error("Game instance not found in startListeningToGameInstanceEvents in GameInstanceClientService");
    this.communicators = await this.sceneCommunicatorClientService.createCommunicators(
      this.currentGameInstanceId,
      this.shouldUseServerTransportForCurrentGame()
    );
    this.listenToGameInstanceMetadataEvents();
    this.listenToGameModeDataEvents();
    this.listenToPlayerEvents();
    this.listenToSpectatorEvents();
    this.listenToGameStateChangedEvents();
    this.listenToUtilityGameEvents();
    this.listenToChatMessagesForNotifications();
    this.listenToSceneShutdown();
  }

  private async stopListeningToGameInstanceEvents() {
    if (!this.currentGameInstanceId || !this.communicators) {
      return;
    }
    await this.sceneCommunicatorClientService.destroyCommunicators(
      this.currentGameInstanceId,
      this.communicatorSubscriptions,
      this.shouldUseServerTransportForCurrentGame()
    );
    this.communicatorSubscriptions = [];
    this.communicators = undefined;
  }

  async startGame(): Promise<void> {
    await this.assignMissingFactionTypes();
    await this.assignMissingTeams();

    await this.gameInstanceMetadataChanged("sessionState", { sessionState: GameSessionState.MovingPlayersToGame });
  }

  private async assignMissingFactionTypes() {
    const players = this.gameInstance!.players;
    for (const player of players) {
      if (!player.playerController.data.playerDefinition!.factionType) {
        const factionType = getRandomFactionType();
        await this.playerChanged(
          "playerController.data.playerDefinition.factionType" as ProbableWafflePlayerDataChangeEventProperty,
          {
            playerNumber: player.playerNumber,
            playerControllerData: { playerDefinition: { factionType } as PositionPlayerDefinition }
          }
        );
      }
    }
  }

  private async assignMissingTeams() {
    const players = this.gameInstance!.players;
    const teamsSet = new Set(players.map((p) => p.playerController.data.playerDefinition!.team));
    for (const player of players) {
      if (player.playerController.data.playerDefinition!.team === undefined) {
        // assign first free team
        let team = 1;
        while (teamsSet.has(team)) {
          team++;
        }
        teamsSet.add(team);
        await this.playerChanged(
          "playerController.data.playerDefinition.team" as ProbableWafflePlayerDataChangeEventProperty,
          {
            playerNumber: player.playerNumber,
            playerControllerData: { playerDefinition: { team } as PositionPlayerDefinition }
          }
        );
      }
    }
  }

  async gameInstanceMetadataChanged(
    property: ProbableWaffleDataChangeEventProperty<ProbableWaffleGameInstanceMetadataData>,
    data: Partial<ProbableWaffleGameInstanceMetadataData>
  ): Promise<void> {
    if (!this.currentGameInstanceId) return;

    this.probableWaffleCommunicatorService.gameInstanceMetadataChanged?.send({
      property: property,
      gameInstanceId: this.currentGameInstanceId,
      emitterUserId: this.authService.userId,
      data
    });
  }

  async gameModeChanged(
    property: ProbableWaffleDataChangeEventProperty<ProbableWaffleGameModeData>,
    gameModeData: Partial<ProbableWaffleGameModeData>
  ): Promise<void> {
    if (!this.currentGameInstanceId) return;

    this.probableWaffleCommunicatorService.gameModeChanged?.send({
      property: property,
      gameInstanceId: this.currentGameInstanceId,
      emitterUserId: this.authService.userId,
      data: gameModeData
    });
  }

  async playerChanged(
    property: ProbableWafflePlayerDataChangeEventProperty,
    data: ProbableWafflePlayerDataChangeEventPayload
  ) {
    if (!this.currentGameInstanceId) return;

    const payload = {
      property: property,
      gameInstanceId: this.currentGameInstanceId,
      emitterUserId: this.authService.userId,
      data
    };

    if (property === "joinedFromNetwork") {
      this.probableWaffleCommunicatorService.playerChanged?.sendToServer(payload);
      return;
    }

    this.probableWaffleCommunicatorService.playerChanged?.send(payload);
  }

  private async spectatorChanged(
    property: ProbableWaffleSpectatorDataChangeEventProperty,
    data: Partial<ProbableWaffleSpectatorData>
  ) {
    if (!this.currentGameInstanceId) return;

    this.probableWaffleCommunicatorService.spectatorChanged?.send({
      property: property,
      gameInstanceId: this.currentGameInstanceId,
      emitterUserId: this.authService.userId,
      data
    });
  }

  /**
   * game instance is fully prepared on server, we're just joining it
   */
  async joinGameInstanceAsPlayerForMatchmaking(gameInstanceId: GameInstanceId): Promise<void> {
    const gameInstanceData = (await this.getGameInstanceData(gameInstanceId))!;
    this.gameInstance = new ProbableWaffleGameInstance(gameInstanceData);
    this.syncCurrentPlayerNumberFromGameInstance();
    await this.startListeningToGameInstanceEvents();
  }

  /**
   * owner only
   */
  async joinGameInstanceAsPlayer(gameInstanceId: GameInstanceId): Promise<void> {
    if (this.currentGameInstanceId) throw new Error("Game instance already exists");
    if (!this.authService.isAuthenticated || !this.serverHealthService.serverAvailable)
      throw new Error("Not authenticated or server not available");

    const gameInstanceData = await this.getGameInstanceData(gameInstanceId);
    if (!gameInstanceData)
      throw new Error("Game instance not found in joinGameInstanceAsPlayer in GameInstanceClientService");
    this.gameInstance = new ProbableWaffleGameInstance(gameInstanceData);
    this.syncCurrentPlayerNumberFromGameInstance();
    await this.startListeningToGameInstanceEvents();

    const userId = this.authService.userId;

    await this.playerChanged("joinedFromNetwork", {
      playerControllerData: { userId }
    });
    console.log("joined game instance as player");
  }

  async addSelfAsPlayer(): Promise<PositionPlayerDefinition> {
    const gameInstance = this.gameInstance;
    if (!gameInstance) throw new Error("Game instance not found in addSelfAsPlayer in GameInstanceClientService");
    const firstFreePlayerNumber = GameSetupHelpers.getFirstFreePlayerNumber(gameInstance.players);
    const firstFreePosition = GameSetupHelpers.getFirstFreePosition(gameInstance.players);
    const playerDefinition = {
      player: createPlayerLobbyDefinition(firstFreePlayerNumber, firstFreePosition),
      playerType: ProbableWafflePlayerType.Human
    } satisfies PositionPlayerDefinition;

    await this.addSelfOrAiPlayer(playerDefinition);
    return playerDefinition;
  }

  async addAiPlayer(position?: number): Promise<PositionPlayerDefinition> {
    const gameInstance = this.gameInstance;
    if (!gameInstance) throw new Error("Game instance not found in addAiPlayer in GameInstanceClientService");
    const firstFreePlayerNumber = GameSetupHelpers.getFirstFreePlayerNumber(gameInstance.players);
    const firstFreePosition = GameSetupHelpers.getFirstFreePosition(gameInstance.players);
    const playerDefinition = {
      player: createPlayerLobbyDefinition(firstFreePlayerNumber, position ?? firstFreePosition),
      playerType: ProbableWafflePlayerType.AI,
      difficulty: ProbableWaffleAiDifficulty.Medium
    } satisfies PositionPlayerDefinition;

    await this.addSelfOrAiPlayer(playerDefinition);

    return playerDefinition;
  }

  async joinGameInstanceAsSpectator(gameInstanceId: GameInstanceId): Promise<void> {
    if (this.currentGameInstanceId) throw new Error("Game instance already exists");
    if (!this.authService.isAuthenticated || !this.serverHealthService.serverAvailable)
      throw new Error("Not authenticated or server not available");

    const gameInstanceData = await this.getGameInstanceData(gameInstanceId);
    if (!gameInstanceData)
      throw new Error("Game instance not found in joinGameInstanceAsSpectator in GameInstanceClientService");
    this.gameInstance = new ProbableWaffleGameInstance(gameInstanceData);
    this.syncCurrentPlayerNumberFromGameInstance();
    await this.startListeningToGameInstanceEvents();
    await this.addSelfAsSpectator();
  }

  async getGameInstanceData(gameInstanceId: GameInstanceId): Promise<ProbableWaffleGameInstanceData | null> {
    if (!this.authService.isAuthenticated || !this.serverHealthService.serverAvailable)
      throw new Error("Not authenticated or server not available");

    const url = environment.api + "api/probable-waffle/get-game-instance";
    return await firstValueFrom(
      this.httpClient.get<ProbableWaffleGameInstanceData | null>(url, { params: { gameInstanceId } })
    );
  }

  async navigateToLobbyOrDirectlyToGame(): Promise<void> {
    if (!this.gameInstance)
      throw new Error("Game instance not found in navigateToLobbyOrDirectlyToGame in GameInstanceClientService");
    switch (this.getNormalizedGameInstanceType()) {
      case ProbableWaffleGameInstanceType.SelfHosted:
        // join lobby
        await this.router.navigate(["aota/lobby"]);
        break;
      case ProbableWaffleGameInstanceType.Skirmish:
        // replaceUrl: true - we don't want to go back to skirmish page
        await this.router.navigate(["aota/lobby"], { replaceUrl: true });
        break;
      case ProbableWaffleGameInstanceType.Matchmaking:
      case ProbableWaffleGameInstanceType.InstantGame:
      case ProbableWaffleGameInstanceType.Replay:
        // directly to game
        await this.router.navigate(["aota/game"]);
        break;
      default:
        console.warn(
          "[GameInstanceClientService] Unknown game instance type, defaulting to direct game navigation:",
          this.gameInstance.gameInstanceMetadata!.data.type
        );
        await this.router.navigate(["aota/game"]);
        break;
    }
  }

  async navigateDirectlyToGame(): Promise<void> {
    if (!this.gameInstance)
      throw new Error("Game instance not found in navigateDirectlyToGame in GameInstanceClientService");
    await this.router.navigate(["aota/game"]);
  }

  get currentGameInstanceId(): string | null {
    return this.gameInstance?.gameInstanceMetadata?.data.gameInstanceId ?? null;
  }

  async playerSlotOpened(): Promise<void> {
    const firstFreePlayerNumber = GameSetupHelpers.getFirstFreePlayerNumber(this.gameInstance!.players);
    const firstFreePosition = GameSetupHelpers.getFirstFreePosition(this.gameInstance!.players);
    await this.playerChanged("joined", {
      playerControllerData: {
        playerDefinition: {
          player: {
            playerNumber: firstFreePlayerNumber,
            playerName: "Player " + firstFreePlayerNumber,
            playerPosition: firstFreePosition,
            joined: false
          } satisfies PlayerLobbyDefinition,
          playerType: ProbableWafflePlayerType.NetworkOpen
        } satisfies PositionPlayerDefinition
      }
    });
  }

  async removePlayer(playerNumber: PlayerNumber): Promise<void> {
    await this.playerChanged("left", {
      playerControllerData: {
        playerDefinition: {
          player: {
            playerNumber
          } as PlayerLobbyDefinition
        } as PositionPlayerDefinition
      }
    });
  }

  async disconnectSelfFromCurrentGame(): Promise<void> {
    if (!this.gameInstance || this.selfExitInProgress) {
      return;
    }

    this.selfExitInProgress = true;
    if (this.currentPlayerNumber !== undefined) {
      await this.removePlayer(this.currentPlayerNumber);
      return;
    }

    const isSpectator = this.gameInstance.spectators.some((s) => s.data.userId === this.authService.userId);
    if (isSpectator && this.authService.userId) {
      await this.spectatorChanged("left", { userId: this.authService.userId });
    }
  }

  private async addSelfOrAiPlayer(playerDefinition: PositionPlayerDefinition): Promise<void> {
    if (!this.currentGameInstanceId) return;

    const playerNumber = playerDefinition.player.playerNumber;
    const player = this.gameInstance!.players.find((p) => p.playerNumber === playerNumber);
    if (player) throw new Error("Player already exists");
    const userId = playerDefinition.playerType === ProbableWafflePlayerType.Human ? this.authService.userId : null;
    await this.playerChanged("joined", {
      playerControllerData: {
        playerDefinition,
        userId
      }
    });
  }

  async addSelfAsSpectator(): Promise<void> {
    await this.spectatorChanged("joined", { userId: this.authService.userId! });
  }

  async getGameFoundListener(): Promise<Observable<ProbableWaffleGameFoundEvent>> {
    const socket = await this.authenticatedSocketService.getSocket();
    return socket!.fromEvent<ProbableWaffleGameFoundEvent, any>(ProbableWaffleGameInstanceEvent.GameFound).pipe(
      filter((data) => data.userIds.includes(this.authService.userId!)),
      map((data) => data)
    );
  }

  async requestGameSearchForMatchmaking(matchmakingOptions: MatchmakingOptions): Promise<void> {
    if (this.currentGameInstanceId) throw new Error("Game instance already exists");
    if (!this.authService.isAuthenticated || !this.serverHealthService.serverAvailable) return;
    const url = environment.api + "api/probable-waffle/matchmaking/request-game-search-for-matchmaking";
    const body: RequestGameSearchForMatchMakingDto = {
      mapPoolIds: matchmakingOptions.levels.filter((l) => l.checked).map((l) => l.id),
      factionType: matchmakingOptions.factionType,
      teamConfiguration: matchmakingOptions.teamConfiguration
    };
    await firstValueFrom(this.httpClient.post<void>(url, body));
  }

  async stopRequestGameSearchForMatchmaking(): Promise<void> {
    if (!this.authService.isAuthenticated || !this.serverHealthService.serverAvailable) return;
    const url = environment.api + "api/probable-waffle/matchmaking/stop-request-game-search-for-matchmaking";
    await firstValueFrom(this.httpClient.delete<void>(url, {}));
  }

  async loadGameInstance(gameInstanceSaveData: ProbableWaffleGameInstanceSaveData): Promise<void> {
    gameInstanceSaveData.gameInstanceData.gameInstanceMetadataData!.startOptions.loadFromSave = true;
    this.gameInstance = new ProbableWaffleGameInstance(gameInstanceSaveData.gameInstanceData);
    this.syncCurrentPlayerNumberFromGameInstance();
    await this.startListeningToGameInstanceEvents();
    await this.navigateDirectlyToGame();
  }

  async saveGameInstance(data: SaveGamePayload): Promise<void> {
    const gameInstanceData = this.gameInstance!.data;
    const name = gameInstanceData.gameInstanceMetadataData!.name;
    await this.gameInstanceStorageService.saveToStorage({
      saveName: name + " " + new Date().toLocaleString(),
      created: new Date(),
      gameInstanceData,
      thumbnail: data.thumbnail
    });
  }

  /**
   * todo this is a prototype
   */
  async startReplay(gameInstanceSaveData: ProbableWaffleGameInstanceSaveData): Promise<void> {
    const replayGameInstanceData = structuredClone(gameInstanceSaveData.gameInstanceData);
    replayGameInstanceData.gameInstanceMetadataData!.type = ProbableWaffleGameInstanceType.Replay;
    this.gameInstance = new ProbableWaffleGameInstance(replayGameInstanceData);
    this.syncCurrentPlayerNumberFromGameInstance();
    await this.startListeningToGameInstanceEvents();
    await this.navigateToLobbyOrDirectlyToGame();
  }

  closeExternalModal(): void {
    if (this.externalModalRef) {
      this.externalModalRef.close();
    }
  }

  async leaveLobby(): Promise<void> {
    const isSkirmish = this.gameInstance?.gameInstanceMetadata?.data.type === ProbableWaffleGameInstanceType.Skirmish;
    const isOffline = !this.authService.isAuthenticated || !this.serverHealthService.serverAvailable;
    await this.disconnectSelfFromCurrentGame();

    if (isOffline || isSkirmish) {
      await this.stopGameInstance();
    } else {
      await this.cleanupLocalGameState();
    }

    await this.router.navigate(["aota"]);
  }

  private async cleanupLocalGameState(): Promise<void> {
    await this.stopListeningToGameInstanceEvents();
    this.gameInstance = undefined;
    this.currentPlayerNumber = undefined;
    this.selfExitInProgress = false;
  }

  private syncCurrentPlayerNumberFromGameInstance(): void {
    if (!this.authService.userId) {
      this.currentPlayerNumber = undefined;
      return;
    }

    this.currentPlayerNumber = this.gameInstance?.players.find(
      (player) => player.playerController.data.userId === this.authService.userId
    )?.playerNumber;
  }

  private getNormalizedGameInstanceType(): ProbableWaffleGameInstanceType | undefined {
    const rawType = this.gameInstance?.gameInstanceMetadata?.data.type;
    return rawType ?? undefined;
  }

  private async handleSelfRemovedFromGameInstance(): Promise<void> {
    await this.cleanupLocalGameState();
    await this.ngZone.run(async () => {
      await this.router.navigate(["aota"]);
    });
  }

  private shouldUseServerTransportForCurrentGame(): boolean {
    switch (this.getNormalizedGameInstanceType()) {
      case ProbableWaffleGameInstanceType.SelfHosted:
      case ProbableWaffleGameInstanceType.Matchmaking:
        return true;
      case ProbableWaffleGameInstanceType.Skirmish:
      case ProbableWaffleGameInstanceType.InstantGame:
      case ProbableWaffleGameInstanceType.Replay:
        return false;
      default:
        return false;
    }
  }
}
