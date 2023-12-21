import { Injectable } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { environment } from "../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import {
  GameInstanceDataDto,
  ProbableWaffleGameCreate,
  ProbableWaffleGameCreateDto,
  ProbableWaffleGameInstance,
  ProbableWaffleGameInstanceData,
  ProbableWaffleLevelEnum
} from "@fuzzy-waddle/api-interfaces";
import { ServerHealthService } from "../../shared/services/server-health.service";
import { SceneCommunicatorClientService } from "./scene-communicator-client.service";
import { AuthService } from "../../auth/auth.service";
import { GameInstanceClientServiceInterface } from "./game-instance-client.service.interface";

@Injectable({
  providedIn: "root"
})
export class GameInstanceClientService implements GameInstanceClientServiceInterface {
  gameInstance?: ProbableWaffleGameInstance;

  constructor(
    private readonly authService: AuthService,
    private readonly httpClient: HttpClient,
    private readonly serverHealthService: ServerHealthService,
    private readonly sceneCommunicatorClientService: SceneCommunicatorClientService
  ) {}

  async startGame(): Promise<void> {
    this.gameInstance = new ProbableWaffleGameInstance({
      gameInstanceMetadataData: { createdBy: this.authService.userId },
      players: [{ userId: this.authService.userId }]
    });
    if (this.authService.isAuthenticated && this.serverHealthService.serverAvailable) {
      const url = environment.api + "api/probable-waffle/start-game";
      const body: GameInstanceDataDto = { gameInstanceId: this.gameInstanceId! };
      await firstValueFrom(this.httpClient.post<void>(url, body));
    }
  }

  async stopGame() {
    if (!this.gameInstanceId) return;
    if (this.authService.isAuthenticated && this.serverHealthService.serverAvailable) {
      const url = environment.api + "api/probable-waffle/stop-game";
      const body: GameInstanceDataDto = { gameInstanceId: this.gameInstanceId };
      await firstValueFrom(this.httpClient.delete<void>(url, { body }));
    }
    await this.stopLevel("local");
  }

  async startLevel(gameCreate: ProbableWaffleGameCreate) {
    if (!this.gameInstanceId) return;
    if (this.authService.isAuthenticated && this.serverHealthService.serverAvailable) {
      const url = environment.api + "api/probable-waffle/start-level";
      const body: ProbableWaffleGameCreateDto = {
        gameInstanceId: this.gameInstanceId,
        ...gameCreate
      };
      await firstValueFrom(this.httpClient.post<void>(url, body));
    }
    this.openLevel(gameCreate.level);
  }

  openLevel(probableWaffleLevel: ProbableWaffleLevelEnum) {
    if (!this.gameInstance) return;
    this.gameInstance.initGame({
      level: probableWaffleLevel
    });
    this.openLevelCommunication(this.gameInstance.gameInstanceMetadata!.data.gameInstanceId!);
  }

  openLevelSpectator(gameInstanceData: ProbableWaffleGameInstanceData) {
    // create new game instance from data we received from server
    this.gameInstance = new ProbableWaffleGameInstance(gameInstanceData);
    this.openLevelCommunication(this.gameInstance.gameInstanceMetadata!.data.gameInstanceId!);
  }

  private openLevelCommunication(gameInstanceId: string) {
    this.sceneCommunicatorClientService.startListeningToEvents(gameInstanceId);
  }

  /**
   * @param removeFrom - if we destroy whole game instance, we don't need to remove game mode from remote again
   */
  async stopLevel(removeFrom: "local" | "localAndRemote"): Promise<void> {
    if (!this.gameInstanceId) return;
    if (
      this.authService.isAuthenticated &&
      this.serverHealthService.serverAvailable &&
      removeFrom === "localAndRemote"
    ) {
      const url = environment.api + "api/probable-waffle/stop-level";
      const body: GameInstanceDataDto = {
        gameInstanceId: this.gameInstanceId
      };
      await firstValueFrom(this.httpClient.delete<void>(url, { body }));
    }
    this.gameInstance!.stopLevel();
    this.sceneCommunicatorClientService.stopListeningToEvents();
  }

  get gameInstanceId(): string | null {
    return this.gameInstance?.gameInstanceMetadata?.data.gameInstanceId ?? null;
  }
}
