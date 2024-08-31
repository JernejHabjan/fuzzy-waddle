import { Injectable, inject } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { HttpClient } from "@angular/common/http";
import {
  GameInstanceDataDto,
  LittleMuncherGameCreate,
  LittleMuncherGameCreateDto,
  LittleMuncherGameInstance,
  LittleMuncherGameInstanceData,
  LittleMuncherLevel
} from "@fuzzy-waddle/api-interfaces";
import { SceneCommunicatorClientService } from "./scene-communicator-client.service";
import { GameInstanceClientServiceInterface } from "./game-instance-client.service.interface";
import { AuthService } from "../../../auth/auth.service";
import { ServerHealthService } from "../../../shared/services/server-health.service";
import { environment } from "../../../../environments/environment";

@Injectable({
  providedIn: "root"
})
export class GameInstanceClientService implements GameInstanceClientServiceInterface {
  private readonly authService = inject(AuthService);
  private readonly httpClient = inject(HttpClient);
  private readonly serverHealthService = inject(ServerHealthService);
  private readonly sceneCommunicatorClientService = inject(SceneCommunicatorClientService);

  gameInstance?: LittleMuncherGameInstance;

  async startGame(): Promise<void> {
    this.gameInstance = new LittleMuncherGameInstance({
      gameInstanceMetadataData: { createdBy: this.authService.userId },
      players: [{ playerControllerData: { userId: this.authService.userId } }]
    });
    if (this.authService.isAuthenticated && this.serverHealthService.serverAvailable) {
      const url = environment.api + "api/little-muncher/start-game";
      const body: GameInstanceDataDto = { gameInstanceId: this.gameInstanceId! };
      await firstValueFrom(this.httpClient.post<void>(url, body));
    }
  }

  async stopGame() {
    if (!this.gameInstanceId) return;
    if (this.authService.isAuthenticated && this.serverHealthService.serverAvailable) {
      const url = environment.api + "api/little-muncher/stop-game";
      const body: GameInstanceDataDto = { gameInstanceId: this.gameInstanceId };
      await firstValueFrom(this.httpClient.delete<void>(url, { body }));
    }
    await this.stopLevel("local");
  }

  async startLevel(gameCreate: LittleMuncherGameCreate) {
    if (!this.gameInstanceId) return;
    if (this.authService.isAuthenticated && this.serverHealthService.serverAvailable) {
      const url = environment.api + "api/little-muncher/start-level";
      const body: LittleMuncherGameCreateDto = {
        gameInstanceId: this.gameInstanceId,
        ...gameCreate
      };
      await firstValueFrom(this.httpClient.post<void>(url, body));
    }
    this.openLevel(gameCreate.level);
  }

  openLevel(littleMuncherLevel: LittleMuncherLevel) {
    if (!this.gameInstance) return;
    this.gameInstance.initGame({
      hill: littleMuncherLevel.hill
    });
    this.openLevelCommunication(this.gameInstance.gameInstanceMetadata!.data.gameInstanceId!);
  }

  openLevelSpectator(gameInstanceData: LittleMuncherGameInstanceData) {
    // create new game instance from data we received from server
    this.gameInstance = new LittleMuncherGameInstance(gameInstanceData);
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
      const url = environment.api + "api/little-muncher/stop-level";
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
