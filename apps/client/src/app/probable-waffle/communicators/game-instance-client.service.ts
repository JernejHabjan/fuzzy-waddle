import { inject, Injectable, NgZone } from "@angular/core";
import { filter, firstValueFrom, Observable, Subject, Subscription } from "rxjs";
import { environment } from "../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import {
  DifficultyModifiers,
  GameSessionState,
  GameSetupHelpers,
  getRandomFactionType,
  MapTuning,
  PlayerLobbyDefinition,
  PositionPlayerDefinition,
  ProbableWaffleAiDifficulty,
  ProbableWaffleDataChangeEventProperty,
  ProbableWaffleGameFoundEvent,
  ProbableWaffleGameInstance,
  ProbableWaffleGameInstanceData,
  ProbableWaffleGameInstanceEvent,
  ProbableWaffleGameInstanceMetadataData,
  ProbableWaffleGameInstanceSaveData,
  ProbableWaffleGameInstanceType,
  ProbableWaffleGameInstanceVisibility,
  ProbableWaffleGameModeData,
  ProbableWaffleGameStateData,
  ProbableWaffleListeners,
  ProbableWafflePlayerDataChangeEventPayload,
  ProbableWafflePlayerDataChangeEventProperty,
  ProbableWafflePlayerType,
  ProbableWaffleSpectatorData,
  ProbableWaffleSpectatorDataChangeEventProperty,
  RequestGameSearchForMatchMakingDto,
  WinConditions
} from "@fuzzy-waddle/api-interfaces";
import { ServerHealthService } from "../../shared/services/server-health.service";
import { ProbableWaffleCommunicators, SceneCommunicatorClientService } from "./scene-communicator-client.service";
import { AuthService } from "../../auth/auth.service";
import { GameInstanceClientServiceInterface } from "./game-instance-client.service.interface";
import { MatchmakingOptions } from "../gui/online/matchmaking/matchmaking.component";
import { Router } from "@angular/router";
import { ProbableWaffleCommunicatorService } from "./probable-waffle-communicator.service";
import { map } from "rxjs/operators";
import { AuthenticatedSocketService } from "../../data-access/chat/authenticated-socket.service";
import { GameInstanceStorageServiceInterface } from "./storage/game-instance-storage.service.interface";
import { SaveGamePayload } from "../game/data/save-game";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { LoadComponent } from "../gui/load/load.component";

@Injectable({
  providedIn: "root"
})
export class GameInstanceClientService implements GameInstanceClientServiceInterface {
  private readonly DEBUG = false;
  gameInstance?: ProbableWaffleGameInstance;
  /**
   * used to track which player number are we in the game
   */
  currentPlayerNumber?: number;

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
        type,
        visibility,
        startOptions: {}
      } satisfies ProbableWaffleGameInstanceMetadataData,
      gameModeData: {
        winConditions: {} satisfies WinConditions,
        mapTuning: {} satisfies MapTuning,
        difficultyModifiers: {} satisfies DifficultyModifiers
      } satisfies ProbableWaffleGameModeData,
      gameStateData: {} as ProbableWaffleGameStateData
    });
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
                await this.router.navigate(["probable-waffle/game"]);
                break;
              case GameSessionState.ToScoreScreen:
                await this.ngZone.run(async () => {
                  await this.router.navigate(["probable-waffle/score-screen"]);
                });
                break;
              case GameSessionState.Stopped:
                await this.stopListeningToGameInstanceEvents();
                this.gameInstance = undefined;
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
          filter((config) => config.name === "save-game" || config.name === "load-game" || config.name === "settings")
        )
        .subscribe(async (payload) => {
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
              const modalRef = this.modalService.open(LoadComponent, { size: "lg", scrollable: true });
              (modalRef.componentInstance as LoadComponent).fromGame = true;
              (modalRef.componentInstance as LoadComponent).dialogRef = modalRef;
              break;
            case "settings":
              // handle settings change
              // todo show dialog
              break;
          }
        })
    );
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
    this.communicators = await this.sceneCommunicatorClientService.createCommunicators(this.currentGameInstanceId);
    this.listenToGameInstanceMetadataEvents();
    this.listenToGameModeDataEvents();
    this.listenToPlayerEvents();
    this.listenToSpectatorEvents();
    this.listenToGameStateChangedEvents();
    this.listenToUtilityGameEvents();
  }

  private async stopListeningToGameInstanceEvents() {
    if (!this.currentGameInstanceId)
      throw new Error("Game instance not found in stopListeningToGameInstanceEvents in GameInstanceClientService");
    await this.sceneCommunicatorClientService.destroyCommunicators(
      this.currentGameInstanceId,
      this.communicatorSubscriptions
    );
  }

  async startGame(): Promise<void> {
    await this.assignMissingFactionTypes();

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

    this.probableWaffleCommunicatorService.playerChanged?.send({
      property: property,
      gameInstanceId: this.currentGameInstanceId,
      emitterUserId: this.authService.userId,
      data
    });
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
  async joinGameInstanceAsPlayerForMatchmaking(gameInstanceId: string): Promise<void> {
    const gameInstanceData = (await this.getGameInstanceData(gameInstanceId))!;
    this.gameInstance = new ProbableWaffleGameInstance(gameInstanceData);
    await this.startListeningToGameInstanceEvents();
  }

  /**
   * owner only
   */
  async joinGameInstanceAsPlayer(gameInstanceId: string): Promise<void> {
    if (this.currentGameInstanceId) throw new Error("Game instance already exists");
    if (!this.authService.isAuthenticated || !this.serverHealthService.serverAvailable)
      throw new Error("Not authenticated or server not available");

    const gameInstanceData = await this.getGameInstanceData(gameInstanceId);
    if (!gameInstanceData)
      throw new Error("Game instance not found in joinGameInstanceAsPlayer in GameInstanceClientService");
    this.gameInstance = new ProbableWaffleGameInstance(gameInstanceData);
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
      // todo move this to single place
      player: {
        playerNumber: firstFreePlayerNumber,
        playerName: "Player " + firstFreePlayerNumber,
        playerPosition: firstFreePosition,
        joined: true
      } satisfies PlayerLobbyDefinition,
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
      // todo move this to single place
      player: {
        playerNumber: firstFreePlayerNumber,
        playerName: "Player " + firstFreePlayerNumber,
        playerPosition: position ?? firstFreePosition,
        joined: true
      } satisfies PlayerLobbyDefinition,
      playerType: ProbableWafflePlayerType.AI,
      difficulty: ProbableWaffleAiDifficulty.Medium
    } satisfies PositionPlayerDefinition;

    await this.addSelfOrAiPlayer(playerDefinition);

    return playerDefinition;
  }

  async joinGameInstanceAsSpectator(gameInstanceId: string): Promise<void> {
    if (this.currentGameInstanceId) throw new Error("Game instance already exists");
    if (!this.authService.isAuthenticated || !this.serverHealthService.serverAvailable)
      throw new Error("Not authenticated or server not available");

    const gameInstanceData = await this.getGameInstanceData(gameInstanceId);
    if (!gameInstanceData)
      throw new Error("Game instance not found in joinGameInstanceAsSpectator in GameInstanceClientService");
    this.gameInstance = new ProbableWaffleGameInstance(gameInstanceData);
    await this.startListeningToGameInstanceEvents();
    await this.addSelfAsSpectator();
  }

  async getGameInstanceData(gameInstanceId: string): Promise<ProbableWaffleGameInstanceData | null> {
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
    switch (this.gameInstance.gameInstanceMetadata!.data.type) {
      case ProbableWaffleGameInstanceType.SelfHosted:
        // join lobby
        await this.router.navigate(["probable-waffle/lobby"]);
        break;
      case ProbableWaffleGameInstanceType.Skirmish:
        // replaceUrl: true - we don't want to go back to skirmish page
        await this.router.navigate(["probable-waffle/lobby"], { replaceUrl: true });
        break;
      case ProbableWaffleGameInstanceType.Matchmaking:
      case ProbableWaffleGameInstanceType.InstantGame:
      case ProbableWaffleGameInstanceType.Replay:
        // directly to game
        await this.router.navigate(["probable-waffle/game"]);
        break;
      default:
        throw new Error("Not implemented");
    }
  }

  async navigateDirectlyToGame(): Promise<void> {
    if (!this.gameInstance)
      throw new Error("Game instance not found in navigateDirectlyToGame in GameInstanceClientService");
    await this.router.navigate(["probable-waffle/game"]);
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

  async removePlayer(playerNumber: number): Promise<void> {
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
      factionType: matchmakingOptions.factionType
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
    gameInstanceSaveData.gameInstanceData.gameInstanceMetadataData!.type = ProbableWaffleGameInstanceType.Replay;
    this.gameInstance = new ProbableWaffleGameInstance(gameInstanceSaveData.gameInstanceData);
    await this.startListeningToGameInstanceEvents();
    await this.navigateToLobbyOrDirectlyToGame();
  }
}
