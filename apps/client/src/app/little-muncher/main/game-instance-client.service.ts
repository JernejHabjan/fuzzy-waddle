import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import {
  LittleMuncherGameCreate,
  LittleMuncherGameCreateDto,
  LittleMuncherGameDestroyDto,
  LittleMuncherGameInstanceCreateDto,
  LittleMuncherGameMode,
  LittleMuncherLevel
} from '@fuzzy-waddle/api-interfaces';
import { ReferenceHolder } from '../game/reference-holder';
import { GameInstance } from '../game/framework/game-instance';
import { ServerHealthService } from '../../shared/services/server-health.service';
import { SceneCommunicatorClientService } from './scene-communicator-client.service';

@Injectable({
  providedIn: 'root'
})
export class GameInstanceClientService {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly serverHealthService: ServerHealthService,
    private readonly sceneCommunicatorClientService: SceneCommunicatorClientService
  ) {}

  async startGame(): Promise<void> {
    ReferenceHolder.gameInstance = new GameInstance();
    if (this.serverHealthService.serverAvailable) {
      const url = environment.api + 'api/little-muncher/start-game';
      const body: LittleMuncherGameInstanceCreateDto = { gameInstanceId: ReferenceHolder.gameInstance.id };
      await firstValueFrom(this.httpClient.post<void>(url, body));
    }
  }

  async stopGame() {
    if (!ReferenceHolder.gameInstance) return;
    if (this.serverHealthService.serverAvailable) {
      const url = environment.api + 'api/little-muncher/stop-game';
      const body: LittleMuncherGameInstanceCreateDto = { gameInstanceId: ReferenceHolder.gameInstance.id };
      await firstValueFrom(this.httpClient.delete<void>(url, { body }));
    }
    ReferenceHolder.gameInstance = null;
    await this.stopLevel('local');
  }

  async startLevel(gameCreate: LittleMuncherGameCreate) {
    if (!ReferenceHolder.gameInstance) return;
    if (this.serverHealthService.serverAvailable) {
      const url = environment.api + 'api/little-muncher/start-level';
      const body: LittleMuncherGameCreateDto = {
        gameInstanceId: ReferenceHolder.gameInstance.id,
        ...gameCreate
      };
      await firstValueFrom(this.httpClient.post<void>(url, body));
    }
    this.openLevel(gameCreate.level);
  }

  openGameInstance(gameInstanceId: string) {
    ReferenceHolder.gameInstance = new GameInstance(gameInstanceId);
  }

  openLevel(littleMuncherLevel: LittleMuncherLevel) {
    ReferenceHolder.gameModeRef = new LittleMuncherGameMode(littleMuncherLevel.hillName);
    this.sceneCommunicatorClientService.startListeningToEvents();
  }

  /**
   * @param removeFrom - if we destroy whole game instance, we don't need to remove game mode from remote again
   */
  async stopLevel(removeFrom: 'local' | 'localAndRemote'): Promise<void> {
    if (!ReferenceHolder.gameInstance || !ReferenceHolder.gameModeRef) return;
    if (this.serverHealthService.serverAvailable && removeFrom === 'localAndRemote') {
      const url = environment.api + 'api/little-muncher/stop-level';
      const body: LittleMuncherGameDestroyDto = {
        gameInstanceId: ReferenceHolder.gameInstance.id
      };
      await firstValueFrom(this.httpClient.delete<void>(url, { body }));
    }
    ReferenceHolder.gameModeRef = null;
    this.sceneCommunicatorClientService.stopListeningToEvents();
  }
}
