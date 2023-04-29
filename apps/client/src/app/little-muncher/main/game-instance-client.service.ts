import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import {
  GameInstanceDataDto,
  LittleMuncherGameCreate,
  LittleMuncherGameCreateDto,
  LittleMuncherGameInstance,
  LittleMuncherGameInstanceMetadata,
  LittleMuncherGameMode,
  LittleMuncherGameState,
  LittleMuncherLevel
} from '@fuzzy-waddle/api-interfaces';
import { ServerHealthService } from '../../shared/services/server-health.service';
import { SceneCommunicatorClientService } from './scene-communicator-client.service';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class GameInstanceClientService {
  constructor(
    private readonly authService: AuthService,
    private readonly httpClient: HttpClient,
    private readonly serverHealthService: ServerHealthService,
    private readonly sceneCommunicatorClientService: SceneCommunicatorClientService
  ) {}

  async startGame(): Promise<LittleMuncherGameInstance> {
    const gameSessionInstance = new LittleMuncherGameInstance();
    gameSessionInstance.initMetadata(new LittleMuncherGameInstanceMetadata());
    if (this.authService.isAuthenticated && this.serverHealthService.serverAvailable) {
      const url = environment.api + 'api/little-muncher/start-game';
      const body: GameInstanceDataDto = { gameInstanceId: gameSessionInstance.gameInstanceMetadata!.gameInstanceId };
      await firstValueFrom(this.httpClient.post<void>(url, body));
    }
    return gameSessionInstance;
  }

  async stopGame(gameSessionInstance: LittleMuncherGameInstance | undefined) {
    if (!gameSessionInstance?.gameInstanceMetadata) return;
    if (this.authService.isAuthenticated && this.serverHealthService.serverAvailable) {
      const url = environment.api + 'api/little-muncher/stop-game';
      const body: GameInstanceDataDto = { gameInstanceId: gameSessionInstance.gameInstanceMetadata.gameInstanceId };
      await firstValueFrom(this.httpClient.delete<void>(url, { body }));
    }
    gameSessionInstance.gameInstanceMetadata = null;
    await this.stopLevel(gameSessionInstance, 'local');
  }

  async startLevel(gameSessionInstance: LittleMuncherGameInstance | undefined, gameCreate: LittleMuncherGameCreate) {
    if (!gameSessionInstance?.gameInstanceMetadata) return;
    if (this.authService.isAuthenticated && this.serverHealthService.serverAvailable) {
      const url = environment.api + 'api/little-muncher/start-level';
      const body: LittleMuncherGameCreateDto = {
        gameInstanceId: gameSessionInstance.gameInstanceMetadata.gameInstanceId,
        ...gameCreate
      };
      await firstValueFrom(this.httpClient.post<void>(url, body));
    }
    this.openLevel(gameSessionInstance, gameCreate.level);
  }

  openGameInstance(gameSessionInstance: LittleMuncherGameInstance, gameInstanceId: string) {
    gameSessionInstance.gameInstanceMetadata = new LittleMuncherGameInstanceMetadata(gameInstanceId);
  }

  openLevel(gameSessionInstance: LittleMuncherGameInstance, littleMuncherLevel: LittleMuncherLevel) {
    gameSessionInstance.initGame(new LittleMuncherGameMode(littleMuncherLevel.hillName), new LittleMuncherGameState());
    this.sceneCommunicatorClientService.startListeningToEvents();
  }

  /**
   * @param gameSessionInstance
   * @param removeFrom - if we destroy whole game instance, we don't need to remove game mode from remote again
   */
  async stopLevel(
    gameSessionInstance: LittleMuncherGameInstance,
    removeFrom: 'local' | 'localAndRemote'
  ): Promise<void> {
    if (!gameSessionInstance.gameInstanceMetadata || !gameSessionInstance.gameMode) return;
    if (
      this.authService.isAuthenticated &&
      this.serverHealthService.serverAvailable &&
      removeFrom === 'localAndRemote'
    ) {
      const url = environment.api + 'api/little-muncher/stop-level';
      const body: GameInstanceDataDto = {
        gameInstanceId: gameSessionInstance.gameInstanceMetadata.gameInstanceId
      };
      await firstValueFrom(this.httpClient.delete<void>(url, { body }));
    }
    gameSessionInstance.stopLevel();
    this.sceneCommunicatorClientService.stopListeningToEvents();
  }
}
