import { inject, Injectable } from "@angular/core";
import { filter, firstValueFrom, Observable, Subscription } from "rxjs";
import { environment } from "../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import {
  GameInstanceDataDto,
  GameSetupHelpers,
  PlayerLobbyDefinition,
  PositionPlayerDefinition,
  ProbableWaffleAddPlayerDto,
  ProbableWaffleAddSpectatorDto,
  ProbableWaffleAiDifficulty,
  ProbableWaffleChangeGameModeDto,
  ProbableWaffleGameFoundEvent,
  ProbableWaffleGameInstance,
  ProbableWaffleGameInstanceData,
  ProbableWaffleGameInstanceEvent,
  ProbableWaffleGameInstanceMetadataData,
  ProbableWaffleGameInstanceType,
  ProbableWaffleGameInstanceVisibility,
  ProbableWaffleGameMode,
  ProbableWaffleGameModeData,
  ProbableWaffleLevelStateChangeEvent,
  ProbableWafflePlayer,
  ProbableWafflePlayerEvent,
  ProbableWafflePlayerLeftDto,
  ProbableWafflePlayerType,
  ProbableWaffleSpectatorEvent,
  ProbableWaffleStartLevelDto,
  RequestGameSearchForMatchMakingDto
} from "@fuzzy-waddle/api-interfaces";
import { ServerHealthService } from "../../shared/services/server-health.service";
import { SceneCommunicatorClientService } from "./scene-communicator-client.service";
import { AuthService } from "../../auth/auth.service";
import { GameInstanceClientServiceInterface } from "./game-instance-client.service.interface";
import { AuthenticatedSocketService } from "../../data-access/chat/authenticated-socket.service";
import { map } from "rxjs/operators";
import { MatchmakingOptions } from "../gui/online/matchmaking/matchmaking.component";
import { Router } from "@angular/router";

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

  async stopGameInstance() {
    if (!this.gameLocalInstanceId) return;
    if (this.authService.isAuthenticated && this.serverHealthService.serverAvailable) {
      const url = environment.api + "api/probable-waffle/stop-game"; // TODO MOVE TO WEBSOCKET FOR GI_GATEWAY
      const body: GameInstanceDataDto = { gameInstanceId: this.gameLocalInstanceId };
      await firstValueFrom(this.httpClient.delete<void>(url, { body }));
    }
    await this.stopGame("local");
  }

  private startListeningToGameInstanceEvents() {
    if (!this.gameLocalInstanceId || !this.authService.isAuthenticated || !this.serverHealthService.serverAvailable)
      return;
    // TODO HERE SUBSCRIBE TO GI GATEWAY

    this.sceneCommunicatorClientService.startListeningToEvents(this.gameLocalInstanceId); // todo?

    this.listeners.set(
      // deprecated
      ProbableWaffleGameInstanceEvent.LevelStateChange,
      this.listenToLevelStateChangeEvents?.subscribe(this.levelStateChange)
    );
    this.listeners.set(
      // deprecated
      ProbableWaffleGameInstanceEvent.Player,
      this.listenToPlayerAvailability?.subscribe(this.playerAvailabilityChange)
    );
    this.listeners.set(
      // deprecated
      ProbableWaffleGameInstanceEvent.Spectator,
      this.listenToSpectatorAvailability?.subscribe(this.spectatorAvailabilityChange)
    );
  }

  private stopListeningToGameInstanceEvents() {
    if (!this.gameLocalInstanceId) return;
    this.sceneCommunicatorClientService.stopListeningToEvents(this.gameLocalInstanceId); // todo?
  }

  async startGame() {
    if (!this.gameLocalInstanceId) return;
    if (this.authService.isAuthenticated && this.serverHealthService.serverAvailable) {
      const url = environment.api + "api/probable-waffle/start-level"; // TODO MOVE TO WEBSOCKET FOR GI_GATEWAY
      const body: ProbableWaffleStartLevelDto = {
        gameInstanceId: this.gameLocalInstanceId
      };
      await firstValueFrom(this.httpClient.post<void>(url, body));
    }
    const level = this.gameInstance!.gameMode!.data.map!;
    // todo ??
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
    if (this.gameLocalInstanceId) throw new Error("Game instance already exists");
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
    const playerDefinition = new PositionPlayerDefinition( // todo move this to single place
      new PlayerLobbyDefinition(
        gameInstance.players.length,
        "Player " + (gameInstance.players.length + 1),
        gameInstance.players.length,
        true
      ),
      null,
      null,
      ProbableWafflePlayerType.Human,
      GameSetupHelpers.getColorForPlayer(gameInstance.players.length),
      null
    );

    await this.addSelfOrAiPlayer(playerDefinition);
  }

  async addAiPlayer(): Promise<void> {
    const gameInstance = this.gameInstance;
    if (!gameInstance) throw new Error("Game instance not found");
    const playerDefinition = new PositionPlayerDefinition( // todo move this to single place
      new PlayerLobbyDefinition(
        gameInstance.players.length,
        "Player " + (gameInstance.players.length + 1),
        gameInstance.players.length,
        true
      ),
      null,
      null,
      ProbableWafflePlayerType.AI,
      GameSetupHelpers.getColorForPlayer(gameInstance.players.length),
      ProbableWaffleAiDifficulty.Medium
    );

    await this.addSelfOrAiPlayer(playerDefinition);
  }

  async joinGameInstanceAsSpectator(gameInstanceId: string): Promise<void> {
    if (this.gameLocalInstanceId) throw new Error("Game instance already exists");
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
    this.sceneCommunicatorClientService.startListeningToEvents(this.gameLocalInstanceId!);
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

  /**
   * @param removeFrom - if we destroy whole game instance, we don't need to remove game mode from remote again
   */
  async stopGame(removeFrom: "local" | "localAndRemote"): Promise<void> {
    if (!this.gameLocalInstanceId) return;
    if (
      this.authService.isAuthenticated &&
      this.serverHealthService.serverAvailable &&
      removeFrom === "localAndRemote"
    ) {
      const url = environment.api + "api/probable-waffle/stop-game"; // TODO MOVE TO WEBSOCKET FOR GI_GATEWAY
      const body: GameInstanceDataDto = {
        gameInstanceId: this.gameLocalInstanceId
      };
      await firstValueFrom(this.httpClient.delete<void>(url, { body }));
    }
    this.gameInstance = undefined;

    this.stopListeningToGameInstanceEvents();
  }

  get gameLocalInstanceId(): string | null {
    return this.gameInstance?.gameInstanceMetadata?.data.gameInstanceId ?? null;
  }

  private levelStateChange = (levelStateChangeEvent: ProbableWaffleLevelStateChangeEvent) => {
    if (!this.gameInstance) return;
    this.gameInstance.gameInstanceMetadata!.data.sessionState = levelStateChangeEvent.sessionState;
  };

  private playerAvailabilityChange = (playerEvent: ProbableWafflePlayerEvent): ProbableWafflePlayer | null => {
    if (!this.gameInstance) return null;
    switch (playerEvent.action) {
      case "joined":
        const player = this.gameInstance.initPlayer(playerEvent.player.stateData, playerEvent.player.controllerData);
        this.gameInstance.addPlayer(player);
        return player;
      case "left":
        this.removePlayer(playerEvent.player.controllerData.playerDefinition!.player.playerNumber);
        break;
      default:
        throw new Error("Unknown player action");
    }
    return null;
  };

  removePlayer(playerNumber: number) {
    this.gameInstance!.players = this.gameInstance!.players.filter(
      (p) => p.playerController.data.playerDefinition!.player.playerNumber !== playerNumber
    );
  }

  private spectatorAvailabilityChange = (spectatorEvent: ProbableWaffleSpectatorEvent): void => {
    if (!this.gameInstance) return;
    switch (spectatorEvent.action) {
      case "joined":
        const spectator = this.gameInstance.initSpectator(spectatorEvent.spectator.data);
        this.gameInstance!.addSpectator(spectator);
        break;
      case "left":
        this.gameInstance!.spectators = this.gameInstance!.spectators.filter(
          (s) => s.data.userId !== spectatorEvent.spectator.data.userId
        );
        break;
      default:
        throw new Error("Unknown spectator action");
    }
  };

  async gameModeChanged(gameModeData: ProbableWaffleGameModeData): Promise<void> {
    if (!this.gameLocalInstanceId) return;
    if (this.authService.isAuthenticated && this.serverHealthService.serverAvailable) {
      const url = environment.api + "api/probable-waffle/change-game-mode"; // TODO MOVE TO WEBSOCKET FOR GI_GATEWAY
      const body: ProbableWaffleChangeGameModeDto = {
        gameInstanceId: this.gameLocalInstanceId,
        gameModeData
      };
      await firstValueFrom(this.httpClient.put<void>(url, body));
    }
    this.gameInstance!.gameMode = new ProbableWaffleGameMode(gameModeData);
  }

  get listenToLevelStateChangeEvents(): Observable<ProbableWaffleLevelStateChangeEvent> | undefined {
    if (!this.gameLocalInstanceId) return;
    const socket = this.authenticatedSocketService.socket;
    return socket
      ?.fromEvent<ProbableWaffleLevelStateChangeEvent>(ProbableWaffleGameInstanceEvent.LevelStateChange)
      .pipe(
        filter(
          (data: ProbableWaffleLevelStateChangeEvent) =>
            data.gameInstanceId === this.gameLocalInstanceId && data.emittingUserId !== this.authService.userId
        ),
        map((data: ProbableWaffleLevelStateChangeEvent) => data)
      );
  }

  private get listenToPlayerAvailability(): Observable<ProbableWafflePlayerEvent> | undefined {
    if (!this.gameLocalInstanceId) return;
    const socket = this.authenticatedSocketService.socket;
    return socket?.fromEvent<ProbableWafflePlayerEvent>(ProbableWaffleGameInstanceEvent.Player).pipe(
      filter(
        (data: ProbableWafflePlayerEvent) =>
          data.gameInstanceId === this.gameLocalInstanceId && data.emittingUserId !== this.authService.userId
      ),
      map((data: ProbableWafflePlayerEvent) => data)
    );
  }

  private get listenToSpectatorAvailability(): Observable<ProbableWaffleSpectatorEvent> | undefined {
    if (!this.gameLocalInstanceId) return;
    const socket = this.authenticatedSocketService.socket;
    return socket?.fromEvent<ProbableWaffleSpectatorEvent>(ProbableWaffleGameInstanceEvent.Spectator).pipe(
      filter(
        (data: ProbableWaffleSpectatorEvent) =>
          data.gameInstanceId === this.gameLocalInstanceId && data.emittingUserId !== this.authService.userId
      ),
      map((data: ProbableWaffleSpectatorEvent) => data)
    );
  }

  async playerSlotOpened(playerDefinition: PositionPlayerDefinition): Promise<void> {
    if (!this.gameLocalInstanceId) return;
    const openPlayerSlot = this.gameInstance!.initPlayer(
      { scoreProbableWaffle: 0 },
      { userId: null, playerDefinition }
    );

    this.playerAvailabilityChange({
      player: {
        controllerData: openPlayerSlot.playerController.data,
        stateData: openPlayerSlot.playerState.data
      },
      gameInstanceId: this.gameLocalInstanceId,
      action: "joined",
      emittingUserId: null
    });

    if (this.authService.isAuthenticated && this.serverHealthService.serverAvailable) {
      const url = environment.api + "api/probable-waffle/open-player-slot"; // TODO MOVE TO WEBSOCKET FOR GI_GATEWAY
      const body: ProbableWaffleAddPlayerDto = {
        gameInstanceId: this.gameLocalInstanceId,
        player: {
          stateData: openPlayerSlot.playerState.data,
          controllerData: openPlayerSlot.playerController.data
        }
      };
      await firstValueFrom(this.httpClient.post<void>(url, body));
    }
  }

  async playerLeftOrSlotClosed(playerNumber: number): Promise<void> {
    if (!this.gameLocalInstanceId) return;
    if (this.authService.isAuthenticated && this.serverHealthService.serverAvailable) {
      const url = environment.api + "api/probable-waffle/player-left"; // TODO MOVE TO WEBSOCKET FOR GI_GATEWAY
      const body: ProbableWafflePlayerLeftDto = {
        gameInstanceId: this.gameLocalInstanceId,
        playerNumber
      };
      await firstValueFrom(this.httpClient.post<void>(url, body));
    }
    this.removePlayer(playerNumber);
  }

  async addSelfOrAiPlayer(playerDefinition: PositionPlayerDefinition): Promise<void> {
    if (!this.gameLocalInstanceId) return;

    const playerNumber = playerDefinition.player.playerNumber;
    let player = this.gameInstance!.players.find(
      (p) => p.playerController.data.playerDefinition?.player.playerNumber === playerNumber
    );
    if (player) throw new Error("Player already exists");
    const userId = playerDefinition.playerType === ProbableWafflePlayerType.Human ? this.authService.userId : null;

    player = this.playerAvailabilityChange({
      player: {
        controllerData: { userId, playerDefinition },
        stateData: { scoreProbableWaffle: 0 }
      },
      gameInstanceId: this.gameLocalInstanceId,
      action: "joined",
      emittingUserId: null
    })!;

    // server
    if (this.authService.isAuthenticated && this.serverHealthService.serverAvailable) {
      const url = environment.api + "api/probable-waffle/add-player"; // TODO MOVE TO WEBSOCKET FOR GI_GATEWAY
      const body: ProbableWaffleAddPlayerDto = {
        gameInstanceId: this.gameLocalInstanceId,
        player: {
          stateData: player.playerState.data,
          controllerData: player.playerController.data
        }
      };
      await firstValueFrom(this.httpClient.post<void>(url, body));
    }
  }

  async addSelfAsSpectator(): Promise<void> {
    if (!this.gameLocalInstanceId) return;

    let spectator = this.gameInstance!.spectators.find((s) => s.data.userId === this.authService.userId);
    if (spectator) throw new Error("Spectator already exists");
    const userId = this.authService.userId;
    spectator = this.gameInstance!.initSpectator({
      userId: userId!
    });

    this.spectatorAvailabilityChange({
      gameInstanceId: this.gameLocalInstanceId,
      action: "joined",
      spectator: {
        data: spectator.data
      },
      emittingUserId: null
    });

    // server
    if (this.authService.isAuthenticated && this.serverHealthService.serverAvailable) {
      const url = environment.api + "api/probable-waffle/add-spectator"; // TODO MOVE TO WEBSOCKET FOR GI_GATEWAY
      const body: ProbableWaffleAddSpectatorDto = {
        gameInstanceId: this.gameLocalInstanceId,
        spectator
      };
      await firstValueFrom(this.httpClient.post<void>(url, body));
    }
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
    if (this.gameLocalInstanceId) throw new Error("Game instance already exists");
    if (!this.authService.isAuthenticated || !this.serverHealthService.serverAvailable) return;
    const url = environment.api + "api/probable-waffle/request-game-search-for-matchmaking";
    const body: RequestGameSearchForMatchMakingDto = {
      mapPoolIds: matchmakingOptions.levels.filter((l) => l.checked).map((l) => l.id),
      factionType: matchmakingOptions.factionType
    };
    await firstValueFrom(this.httpClient.post<void>(url, body));
  }

  async stopRequestGameSearchForMatchmaking(): Promise<void> {
    if (!this.authService.isAuthenticated || !this.serverHealthService.serverAvailable) return;
    const url = environment.api + "api/probable-waffle/stop-request-game-search-for-matchmaking";
    await firstValueFrom(this.httpClient.delete<void>(url, {}));
  }
}
