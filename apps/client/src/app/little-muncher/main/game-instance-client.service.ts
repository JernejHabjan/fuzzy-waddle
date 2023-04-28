import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import {
  GameCreateDto,
  GameDestroyDto,
  LittleMuncherGameCreate,
  LittleMuncherGameCreateDto,
  LittleMuncherGameInstance,
  LittleMuncherGameMode,
  LittleMuncherGameSessionInstance,
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

  async startGame(gameSessionInstance: LittleMuncherGameSessionInstance): Promise<void> {
    gameSessionInstance.gameInstance = new LittleMuncherGameInstance();
    if (this.authService.isAuthenticated && this.serverHealthService.serverAvailable) {
      const url = environment.api + 'api/little-muncher/start-game';
      const body: GameCreateDto = { gameInstanceId: gameSessionInstance.gameInstance.gameInstanceId };
      await firstValueFrom(this.httpClient.post<void>(url, body));
    }
  }

  async stopGame(gameSessionInstance: LittleMuncherGameSessionInstance) {
    if (!gameSessionInstance.gameInstance) return;
    if (this.authService.isAuthenticated && this.serverHealthService.serverAvailable) {
      const url = environment.api + 'api/little-muncher/stop-game';
      const body: GameCreateDto = { gameInstanceId: gameSessionInstance.gameInstance.gameInstanceId };
      await firstValueFrom(this.httpClient.delete<void>(url, { body }));
    }
    gameSessionInstance.gameInstance = null;
    await this.stopLevel(gameSessionInstance, 'local');
  }

  async startLevel(gameSessionInstance: LittleMuncherGameSessionInstance, gameCreate: LittleMuncherGameCreate) {
    if (!gameSessionInstance.gameInstance) return;
    if (this.authService.isAuthenticated && this.serverHealthService.serverAvailable) {
      const url = environment.api + 'api/little-muncher/start-level';
      const body: LittleMuncherGameCreateDto = {
        gameInstanceId: gameSessionInstance.gameInstance.gameInstanceId,
        ...gameCreate
      };
      await firstValueFrom(this.httpClient.post<void>(url, body));
    }
    this.openLevel(gameSessionInstance, gameCreate.level);
  }

  openGameInstance(gameSessionInstance: LittleMuncherGameSessionInstance, gameInstanceId: string) {
    gameSessionInstance.gameInstance = new LittleMuncherGameInstance(gameInstanceId);
  }

  openLevel(gameSessionInstance: LittleMuncherGameSessionInstance, littleMuncherLevel: LittleMuncherLevel) {
    gameSessionInstance.gameModeRef = new LittleMuncherGameMode(littleMuncherLevel.hillName);
    this.sceneCommunicatorClientService.startListeningToEvents();
  }

  /**
   * @param gameSessionInstance
   * @param removeFrom - if we destroy whole game instance, we don't need to remove game mode from remote again
   */
  async stopLevel(
    gameSessionInstance: LittleMuncherGameSessionInstance,
    removeFrom: 'local' | 'localAndRemote'
  ): Promise<void> {
    if (!gameSessionInstance.gameInstance || !gameSessionInstance.gameModeRef) return;
    if (
      this.authService.isAuthenticated &&
      this.serverHealthService.serverAvailable &&
      removeFrom === 'localAndRemote'
    ) {
      const url = environment.api + 'api/little-muncher/stop-level';
      const body: GameDestroyDto = {
        gameInstanceId: gameSessionInstance.gameInstance.gameInstanceId
      };
      await firstValueFrom(this.httpClient.delete<void>(url, { body }));
    }
    gameSessionInstance.gameModeRef = null;
    this.sceneCommunicatorClientService.stopListeningToEvents();
  }
}
