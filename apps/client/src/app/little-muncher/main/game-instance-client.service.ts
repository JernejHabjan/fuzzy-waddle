import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import {
  GameInstanceDataDto,
  LittleMuncherGameCreate,
  LittleMuncherGameCreateDto,
  LittleMuncherGameInstance,
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
  gameInstance?: LittleMuncherGameInstance;

  constructor(
    private readonly authService: AuthService,
    private readonly httpClient: HttpClient,
    private readonly serverHealthService: ServerHealthService,
    private readonly sceneCommunicatorClientService: SceneCommunicatorClientService
  ) {}

  async startGame(): Promise<void> {
    this.gameInstance = new LittleMuncherGameInstance();
    this.gameInstance.init(null, this.authService.userId);
    if (this.authService.isAuthenticated && this.serverHealthService.serverAvailable) {
      const url = environment.api + 'api/little-muncher/start-game';
      const body: GameInstanceDataDto = { gameInstanceId: this.gameInstanceId! };
      await firstValueFrom(this.httpClient.post<void>(url, body));
    }
  }

  async stopGame() {
    if (!this.gameInstanceId) return;
    if (this.authService.isAuthenticated && this.serverHealthService.serverAvailable) {
      const url = environment.api + 'api/little-muncher/stop-game';
      const body: GameInstanceDataDto = { gameInstanceId: this.gameInstanceId };
      await firstValueFrom(this.httpClient.delete<void>(url, { body }));
    }
    await this.stopLevel('local');
  }

  async startLevel(gameCreate: LittleMuncherGameCreate) {
    if (!this.gameInstanceId) return;
    if (this.authService.isAuthenticated && this.serverHealthService.serverAvailable) {
      const url = environment.api + 'api/little-muncher/start-level';
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
    this.gameInstance.initGame(new LittleMuncherGameMode(littleMuncherLevel.hillName), new LittleMuncherGameState());
    this.openLevelCommunication(this.gameInstance.gameInstanceMetadata!.gameInstanceId);
  }

  openLevelSpectator(gameInstance: LittleMuncherGameInstance) {
    // create new game instance from data we received from server
    this.gameInstance = new LittleMuncherGameInstance(gameInstance);
    this.openLevelCommunication(this.gameInstance.gameInstanceMetadata!.gameInstanceId);
  }

  private openLevelCommunication(gameInstanceId: string) {
    this.sceneCommunicatorClientService.startListeningToEvents(gameInstanceId);
  }

  /**
   * @param removeFrom - if we destroy whole game instance, we don't need to remove game mode from remote again
   */
  async stopLevel(removeFrom: 'local' | 'localAndRemote'): Promise<void> {
    if (!this.gameInstanceId) return;
    if (
      this.authService.isAuthenticated &&
      this.serverHealthService.serverAvailable &&
      removeFrom === 'localAndRemote'
    ) {
      const url = environment.api + 'api/little-muncher/stop-level';
      const body: GameInstanceDataDto = {
        gameInstanceId: this.gameInstanceId
      };
      await firstValueFrom(this.httpClient.delete<void>(url, { body }));
    }
    this.gameInstance!.stopLevel();
    this.sceneCommunicatorClientService.stopListeningToEvents();
  }

  get gameInstanceId(): string | null {
    return this.gameInstance?.gameInstanceMetadata?.gameInstanceId ?? null;
  }
}
