import { inject, Injectable } from "@angular/core";
import { filter, firstValueFrom, Observable, Subscription } from "rxjs";
import { environment } from "../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import {
  GameSessionState,
  GameSetupHelpers,
  PlayerLobbyDefinition,
  PositionPlayerDefinition,
  ProbableWaffleAiDifficulty,
  ProbableWaffleDataChangeEventProperty,
  ProbableWaffleGameFoundEvent,
  ProbableWaffleGameInstance,
  ProbableWaffleGameInstanceData,
  ProbableWaffleGameInstanceEvent,
  ProbableWaffleGameInstanceMetadataData,
  ProbableWaffleGameInstanceType,
  ProbableWaffleGameInstanceVisibility,
  ProbableWaffleGameModeData,
  ProbableWaffleListeners,
  ProbableWafflePlayerDataChangeEventPayload,
  ProbableWafflePlayerDataChangeEventProperty,
  ProbableWafflePlayerType,
  ProbableWaffleSpectatorData,
  ProbableWaffleSpectatorDataChangeEventProperty,
  RequestGameSearchForMatchMakingDto
} from "@fuzzy-waddle/api-interfaces";
import { ServerHealthService } from "../../shared/services/server-health.service";
import { SceneCommunicatorClientService } from "./scene-communicator-client.service";
import { AuthService } from "../../auth/auth.service";
import { GameInstanceClientServiceInterface } from "./game-instance-client.service.interface";
import { MatchmakingOptions } from "../gui/online/matchmaking/matchmaking.component";
import { Router } from "@angular/router";
import { ProbableWaffleCommunicatorService } from "./probable-waffle-communicator.service";
import { map } from "rxjs/operators";
import { AuthenticatedSocketService } from "../../data-access/chat/authenticated-socket.service";

@Injectable({
  providedIn: "root"
})
export class GameInstanceClientService implements GameInstanceClientServiceInterface {
  gameInstance?: ProbableWaffleGameInstance;
  private listeners = new Map<string, Subscription | undefined>();

  private readonly authService = inject(AuthService);
  private readonly httpClient = inject(HttpClient);
  private readonly serverHealthService = inject(ServerHealthService);
  private readonly sceneCommunicatorClientService = inject(SceneCommunicatorClientService);
  private readonly authenticatedSocketService = inject(AuthenticatedSocketService);
  private readonly router = inject(Router);
  private readonly probableWaffleCommunicatorService = inject(ProbableWaffleCommunicatorService);

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
        visibility
      }
    });
    if (this.authService.isAuthenticated && this.serverHealthService.serverAvailable) {
      const url = environment.api + "api/probable-waffle/start-game";
      const body: ProbableWaffleGameInstanceMetadataData = this.gameInstance.gameInstanceMetadata!.data;
      await firstValueFrom(this.httpClient.post<void>(url, body));
    }

    this.startListeningToGameInstanceEvents();
  }

  /**
   * relates to {@link listenToGameInstanceMetadataEvents}
   */
  async stopGameInstance(): Promise<void> {
    await this.gameInstanceMetadataChanged("sessionState", { sessionState: GameSessionState.Stopped });
  }

  listenToGameInstanceMetadataEvents(): void {
    this.listeners.set(
      "listenToGameInstanceMetadataEvents",
      this.probableWaffleCommunicatorService.gameInstanceMetadataChanged?.on.subscribe((payload) => {
        ProbableWaffleListeners.gameInstanceMetadataChanged(this.gameInstance, payload);
        switch (payload.property) {
          case "sessionState":
            switch (payload.data.sessionState) {
              case GameSessionState.Stopped:
                this.stopListeningToGameInstanceEvents();
                this.gameInstance = undefined;
                break;
            }
            break;
        }
      })
    );
  }

  listenToGameModeDataEvents(): void {
    this.listeners.set(
      "listenToGameModeDataEvents",
      this.probableWaffleCommunicatorService.gameModeChanged?.on.subscribe((payload) =>
        ProbableWaffleListeners.gameModeChanged(this.gameInstance, payload)
      )
    );
  }

  listenToPlayerEvents(): void {
    this.listeners.set(
      "listenToPlayerEvents",
      this.probableWaffleCommunicatorService.playerChanged?.on.subscribe((payload) =>
        ProbableWaffleListeners.playerChanged(this.gameInstance, payload)
      )
    );
  }

  listenToSpectatorEvents(): void {
    this.listeners.set(
      "listenToSpectatorEvents",
      this.probableWaffleCommunicatorService.spectatorChanged?.on.subscribe((payload) =>
        ProbableWaffleListeners.spectatorChanged(this.gameInstance, payload)
      )
    );
  }

  private startListeningToGameInstanceEvents() {
    if (!this.currentGameInstanceId) throw new Error("Game instance not found");
    this.sceneCommunicatorClientService.createCommunicators(this.currentGameInstanceId);
    this.listenToGameInstanceMetadataEvents();
    this.listenToGameModeDataEvents();
    this.listenToPlayerEvents();
    this.listenToSpectatorEvents();
  }

  private stopListeningToGameInstanceEvents() {
    if (!this.currentGameInstanceId) throw new Error("Game instance not found");
    this.sceneCommunicatorClientService.destroyCommunicators(this.currentGameInstanceId);
    this.listeners.forEach((s) => s?.unsubscribe());
  }

  async startGame(): Promise<void> {
    await this.gameInstanceMetadataChanged("sessionState", { sessionState: GameSessionState.Starting });
  }

  private async gameInstanceMetadataChanged(
    property: ProbableWaffleDataChangeEventProperty<ProbableWaffleGameInstanceMetadataData>,
    data: Partial<ProbableWaffleGameInstanceMetadataData>
  ) {
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
    gameModeData: ProbableWaffleGameModeData
  ): Promise<void> {
    if (!this.currentGameInstanceId) return;

    this.probableWaffleCommunicatorService.gameModeChanged?.send({
      property: property,
      gameInstanceId: this.currentGameInstanceId,
      emitterUserId: this.authService.userId,
      data: gameModeData
    });
  }

  private async playerChanged(
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
    this.startListeningToGameInstanceEvents();
  }

  /**
   * owner only
   */
  async joinGameInstanceAsPlayer(gameInstanceId: string): Promise<void> {
    if (this.currentGameInstanceId) throw new Error("Game instance already exists");
    if (!this.authService.isAuthenticated || !this.serverHealthService.serverAvailable)
      throw new Error("Not authenticated or server not available");

    const gameInstanceData = await this.getGameInstanceData(gameInstanceId);
    if (!gameInstanceData) throw new Error("Game instance not found");
    this.gameInstance = new ProbableWaffleGameInstance(gameInstanceData);

    await this.addSelfAsPlayer();

    this.startListeningToGameInstanceEvents();
  }

  async addSelfAsPlayer(): Promise<void> {
    const gameInstance = this.gameInstance;
    if (!gameInstance) throw new Error("Game instance not found");
    const playerDefinition = {
      // todo move this to single place
      player: {
        playerNumber: gameInstance.players.length,
        playerName: "Player " + (gameInstance.players.length + 1),
        playerPosition: gameInstance.players.length,
        joined: true
      } satisfies PlayerLobbyDefinition,
      playerType: ProbableWafflePlayerType.Human,
      playerColor: GameSetupHelpers.getColorForPlayer(gameInstance.players.length)
    } satisfies PositionPlayerDefinition;

    await this.addSelfOrAiPlayer(playerDefinition);
  }

  async addAiPlayer(): Promise<void> {
    const gameInstance = this.gameInstance;
    if (!gameInstance) throw new Error("Game instance not found");
    const playerDefinition = {
      // todo move this to single place
      player: {
        playerNumber: gameInstance.players.length,
        playerName: "Player " + (gameInstance.players.length + 1),
        playerPosition: gameInstance.players.length,
        joined: true
      } satisfies PlayerLobbyDefinition,
      playerType: ProbableWafflePlayerType.AI,
      playerColor: GameSetupHelpers.getColorForPlayer(gameInstance.players.length),
      difficulty: ProbableWaffleAiDifficulty.Medium
    } satisfies PositionPlayerDefinition;

    await this.addSelfOrAiPlayer(playerDefinition);
  }

  async joinGameInstanceAsSpectator(gameInstanceId: string): Promise<void> {
    if (this.currentGameInstanceId) throw new Error("Game instance already exists");
    if (!this.authService.isAuthenticated || !this.serverHealthService.serverAvailable)
      throw new Error("Not authenticated or server not available");

    const gameInstanceData = await this.getGameInstanceData(gameInstanceId);
    if (!gameInstanceData) throw new Error("Game instance not found");
    this.gameInstance = new ProbableWaffleGameInstance(gameInstanceData);
    await this.addSelfAsSpectator();

    this.startListeningToGameInstanceEvents();
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
    if (!this.gameInstance) throw new Error("Game instance not found");
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
        // directly to game
        await this.router.navigate(["probable-waffle/game"]);
        break;
      default:
        throw new Error("Not implemented");
    }
  }

  get currentGameInstanceId(): string | null {
    return this.gameInstance?.gameInstanceMetadata?.data.gameInstanceId ?? null;
  }

  async playerSlotOpened(playerDefinition: PositionPlayerDefinition): Promise<void> {
    await this.playerChanged("joined", {
      playerControllerData: {
        playerDefinition
      }
    });
  }

  async playerLeftOrSlotClosed(playerNumber: number): Promise<void> {
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

  async addSelfOrAiPlayer(playerDefinition: PositionPlayerDefinition): Promise<void> {
    if (!this.currentGameInstanceId) return;

    const playerNumber = playerDefinition.player.playerNumber;
    const player = this.gameInstance!.players.find(
      (p) => p.playerController.data.playerDefinition?.player.playerNumber === playerNumber
    );
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

  listenToGameFound(): Observable<ProbableWaffleGameFoundEvent> {
    return this.authenticatedSocketService
      .socket!.fromEvent<ProbableWaffleGameFoundEvent>(ProbableWaffleGameInstanceEvent.GameFound)
      .pipe(
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
}
