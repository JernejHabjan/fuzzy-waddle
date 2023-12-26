import { inject, Injectable } from "@angular/core";
import { filter, firstValueFrom, Observable, Subscription } from "rxjs";
import { environment } from "../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import {
  GameInstanceDataDto,
  PositionPlayerDefinition,
  ProbableWaffleAddPlayerDto,
  ProbableWaffleAddSpectatorDto,
  ProbableWaffleChangeGameModeDto,
  ProbableWaffleGameInstance,
  ProbableWaffleGameInstanceData,
  ProbableWaffleGameInstanceDataDto,
  ProbableWaffleGameInstanceEvent,
  ProbableWaffleGameMode,
  ProbableWaffleGameModeData,
  ProbableWaffleLevelStateChangeEvent,
  ProbableWafflePlayerEvent,
  ProbableWafflePlayerLeftDto,
  ProbableWafflePlayerType,
  ProbableWaffleSpectatorEvent,
  ProbableWaffleStartLevelDto
} from "@fuzzy-waddle/api-interfaces";
import { ServerHealthService } from "../../shared/services/server-health.service";
import { SceneCommunicatorClientService } from "./scene-communicator-client.service";
import { AuthService } from "../../auth/auth.service";
import { GameInstanceClientServiceInterface } from "./game-instance-client.service.interface";
import { AuthenticatedSocketService } from "../../data-access/chat/authenticated-socket.service";
import { map } from "rxjs/operators";

@Injectable({
  providedIn: "root"
})
export class GameInstanceClientService implements GameInstanceClientServiceInterface {
  gameInstance?: ProbableWaffleGameInstance;
  listeners = new Map<string, Subscription | undefined>();

  private readonly authService = inject(AuthService);
  private readonly httpClient = inject(HttpClient);
  private readonly serverHealthService = inject(ServerHealthService);
  private readonly sceneCommunicatorClientService = inject(SceneCommunicatorClientService);
  private readonly authenticatedSocketService = inject(AuthenticatedSocketService);

  async createGameInstance(joinable: boolean): Promise<void> {
    this.gameInstance = new ProbableWaffleGameInstance({
      gameInstanceMetadataData: { createdBy: this.authService.userId }
    });
    if (this.authService.isAuthenticated && this.serverHealthService.serverAvailable) {
      const url = environment.api + "api/probable-waffle/start-game";
      const body: ProbableWaffleGameInstanceDataDto = { gameInstanceId: this.gameLocalInstanceId!, joinable };
      await firstValueFrom(this.httpClient.post<void>(url, body));

      this.listeners.set(
        ProbableWaffleGameInstanceEvent.LevelStateChange,
        this.listenToLevelStateChangeEvents?.subscribe(this.levelStateChange)
      );
      this.listeners.set(
        ProbableWaffleGameInstanceEvent.Player,
        this.listenToPlayerAvailability?.subscribe(this.playerAvailabilityChange)
      );
      this.listeners.set(
        ProbableWaffleGameInstanceEvent.Spectator,
        this.listenToSpectatorAvailability?.subscribe(this.spectatorAvailabilityChange)
      );
    }
  }

  async stopGameInstance() {
    if (!this.gameLocalInstanceId) return;
    if (this.authService.isAuthenticated && this.serverHealthService.serverAvailable) {
      const url = environment.api + "api/probable-waffle/stop-game";
      const body: GameInstanceDataDto = { gameInstanceId: this.gameLocalInstanceId };
      await firstValueFrom(this.httpClient.delete<void>(url, { body }));
    }
    await this.stopGame("local");
  }

  async startGame() {
    if (!this.gameLocalInstanceId) return;
    if (this.authService.isAuthenticated && this.serverHealthService.serverAvailable) {
      const url = environment.api + "api/probable-waffle/start-level";
      const body: ProbableWaffleStartLevelDto = {
        gameInstanceId: this.gameLocalInstanceId
      };
      await firstValueFrom(this.httpClient.post<void>(url, body));
    }
    const level = this.gameInstance!.gameMode!.data.map!;
    // todo ??
  }

  /**
   * owner only
   */
  async joinToLobbyAsPlayer(gameInstanceId: string): Promise<void> {
    if (this.gameLocalInstanceId) throw new Error("Game instance already exists");
    if (!this.authService.isAuthenticated || !this.serverHealthService.serverAvailable)
      throw new Error("Not authenticated or server not available");

    const url = environment.api + "api/probable-waffle/get-game-instance";
    const gameInstanceData = await firstValueFrom(
      this.httpClient.get<ProbableWaffleGameInstanceData>(url, { params: { gameInstanceId } })
    );
    this.gameInstance = new ProbableWaffleGameInstance(gameInstanceData);
    // todo ? await this.tryJoin();
    this.openLevelCommunication(gameInstanceId);
  }

  async joinToLobbyAsSpectator(gameInstanceId: string): Promise<void> {
    if (this.gameLocalInstanceId) throw new Error("Game instance already exists");
    if (!this.authService.isAuthenticated || !this.serverHealthService.serverAvailable)
      throw new Error("Not authenticated or server not available");

    const url = environment.api + "api/probable-waffle/get-game-instance";
    const gameInstanceData = await firstValueFrom(
      this.httpClient.get<ProbableWaffleGameInstanceData>(url, { params: { gameInstanceId } })
    );
    this.gameInstance = new ProbableWaffleGameInstance(gameInstanceData);
    await this.addSelfAsSpectator();
    this.openLevelCommunication(gameInstanceId);
  }

  private openLevelCommunication(gameInstanceId: string) {
    this.sceneCommunicatorClientService.startListeningToEvents(gameInstanceId);
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
      const url = environment.api + "api/probable-waffle/stop-game";
      const body: GameInstanceDataDto = {
        gameInstanceId: this.gameLocalInstanceId
      };
      await firstValueFrom(this.httpClient.delete<void>(url, { body }));
    }
    this.gameInstance = undefined;
    this.sceneCommunicatorClientService.stopListeningToEvents();
  }

  get gameLocalInstanceId(): string | null {
    return this.gameInstance?.gameInstanceMetadata?.data.gameInstanceId ?? null;
  }

  private levelStateChange = (levelStateChangeEvent: ProbableWaffleLevelStateChangeEvent) => {
    if (!this.gameInstance) return;
    this.gameInstance.gameInstanceMetadata!.data.sessionState = levelStateChangeEvent.sessionState;
  };

  private playerAvailabilityChange = (playerEvent: ProbableWafflePlayerEvent) => {
    if (!this.gameInstance) return;
    switch (playerEvent.action) {
      case "joined":
        this.gameInstance.addPlayer(playerEvent.player);
        break;
      case "left":
        this.gameInstance.players = this.gameInstance.players.filter((p) => p.userId !== playerEvent.user_id);
        break;
      default:
        throw new Error("Unknown player action");
    }
  };

  private spectatorAvailabilityChange = (spectatorEvent: ProbableWaffleSpectatorEvent) => {
    if (!this.gameInstance) return;
    switch (spectatorEvent.action) {
      case "joined":
        this.gameInstance!.addSpectator(spectatorEvent.spectator);
        break;
      case "left":
        this.gameInstance!.spectators = this.gameInstance!.spectators.filter(
          (s) => s.data.userId !== spectatorEvent.user_id
        );
        break;
      default:
        throw new Error("Unknown spectator action");
    }
  };

  async gameModeChanged(gameModeData: ProbableWaffleGameModeData) {
    if (!this.gameLocalInstanceId) return;
    if (this.authService.isAuthenticated && this.serverHealthService.serverAvailable) {
      const url = environment.api + "api/probable-waffle/change-game-mode";
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
        filter((data: ProbableWaffleLevelStateChangeEvent) => data.gameInstanceId === this.gameLocalInstanceId),
        map((data: ProbableWaffleLevelStateChangeEvent) => data)
      );
  }

  private get listenToPlayerAvailability(): Observable<ProbableWafflePlayerEvent> | undefined {
    if (!this.gameLocalInstanceId) return;
    const socket = this.authenticatedSocketService.socket;
    return socket?.fromEvent<ProbableWafflePlayerEvent>(ProbableWaffleGameInstanceEvent.Player).pipe(
      filter((data: ProbableWafflePlayerEvent) => data.gameInstanceId === this.gameLocalInstanceId),
      map((data: ProbableWafflePlayerEvent) => data)
    );
  }

  private get listenToSpectatorAvailability(): Observable<ProbableWaffleSpectatorEvent> | undefined {
    if (!this.gameLocalInstanceId) return;
    const socket = this.authenticatedSocketService.socket;
    return socket?.fromEvent<ProbableWaffleSpectatorEvent>(ProbableWaffleGameInstanceEvent.Spectator).pipe(
      filter((data: ProbableWaffleSpectatorEvent) => data.gameInstanceId === this.gameLocalInstanceId),
      map((data: ProbableWaffleSpectatorEvent) => data)
    );
  }

  async playerSlotOpened() {
    if (!this.gameLocalInstanceId) return;
    if (this.authService.isAuthenticated && this.serverHealthService.serverAvailable) {
      const url = environment.api + "api/probable-waffle/open-player-slot";
      const body: GameInstanceDataDto = {
        gameInstanceId: this.gameLocalInstanceId
      };
      await firstValueFrom(this.httpClient.post<void>(url, body));
    }
  }

  async playerLeft(playerNumber: number) {
    if (!this.gameLocalInstanceId) return;
    if (this.authService.isAuthenticated && this.serverHealthService.serverAvailable) {
      const url = environment.api + "api/probable-waffle/player-left";
      const body: ProbableWafflePlayerLeftDto = {
        gameInstanceId: this.gameLocalInstanceId,
        playerNumber
      };
      await firstValueFrom(this.httpClient.post<void>(url, body));
    }
    this.playerAvailabilityChange({
      player: this.gameInstance!.players[playerNumber],
      user_id: this.gameInstance!.players[playerNumber].userId!,
      gameInstanceId: this.gameLocalInstanceId,
      action: "left"
    });
  }

  async addSelfOrAiPlayer(playerDefinition: PositionPlayerDefinition) {
    if (!this.gameLocalInstanceId) return;

    const playerNumber = playerDefinition.player.playerNumber;
    let player = this.gameInstance!.players.find(
      (p) => p.playerController.data.playerDefinition?.player.playerNumber === playerNumber
    );
    if (player) throw new Error("Player already exists");
    const user_id = playerDefinition.playerType === ProbableWafflePlayerType.Human ? this.authService.userId : null;
    player = this.gameInstance!.initPlayer(user_id, { score: 0 }, { playerDefinition });

    this.playerAvailabilityChange({
      player,
      user_id,
      gameInstanceId: this.gameLocalInstanceId,
      action: "joined"
    });

    // server
    if (this.authService.isAuthenticated && this.serverHealthService.serverAvailable) {
      const url = environment.api + "api/probable-waffle/add-player";
      const body: ProbableWaffleAddPlayerDto = {
        gameInstanceId: this.gameLocalInstanceId,
        player
      };
      await firstValueFrom(this.httpClient.post<void>(url, body));
    }
  }

  async addSelfAsSpectator(): Promise<void> {
    if (!this.gameLocalInstanceId) return;

    let spectator = this.gameInstance!.spectators.find((s) => s.data.userId === this.authService.userId);
    if (spectator) throw new Error("Spectator already exists");
    const user_id = this.authService.userId;
    spectator = this.gameInstance!.initSpectator({
      userId: user_id!
    });

    this.spectatorAvailabilityChange({
      user_id: this.authService.userId!,
      gameInstanceId: this.gameLocalInstanceId,
      action: "joined",
      spectator
    });

    // server
    if (this.authService.isAuthenticated && this.serverHealthService.serverAvailable) {
      const url = environment.api + "api/probable-waffle/add-spectator";
      const body: ProbableWaffleAddSpectatorDto = {
        gameInstanceId: this.gameLocalInstanceId,
        spectator
      };
      await firstValueFrom(this.httpClient.post<void>(url, body));
    }
  }
}
