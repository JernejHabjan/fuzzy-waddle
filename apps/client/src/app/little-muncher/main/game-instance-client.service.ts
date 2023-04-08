import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import {
  LittleMuncherGameInstanceCreateDto,
  LittleMuncherGameMode,
  LittleMuncherGameModeCreateDto,
  LittleMuncherHills
} from '@fuzzy-waddle/api-interfaces';
import { ReferenceHolder } from '../game/reference-holder';
import { GameInstance } from '../game/framework/game-instance';
import { ServerHealthService } from '../../shared/services/server-health.service';

@Injectable({
  providedIn: 'root'
})
export class GameInstanceClientService {
  constructor(private readonly httpClient: HttpClient, private readonly serverHealthService: ServerHealthService) {}

  async createGameInstance(): Promise<void> {
    ReferenceHolder.gameInstance = new GameInstance();
    if (this.serverHealthService.serverAvailable) {
      const url = environment.api + 'api/little-muncher/create-game-instance';
      const body: LittleMuncherGameInstanceCreateDto = { gameInstanceId: ReferenceHolder.gameInstance.id };
      await firstValueFrom(this.httpClient.post<void>(url, body));
    }
  }

  async destroyGameInstance() {
    if (!ReferenceHolder.gameInstance) return;
    if (this.serverHealthService.serverAvailable) {
      const url = environment.api + 'api/little-muncher/destroy-game-instance';
      const body: LittleMuncherGameInstanceCreateDto = { gameInstanceId: ReferenceHolder.gameInstance.id };
      await firstValueFrom(this.httpClient.delete<void>(url, { body }));
    }
    ReferenceHolder.gameInstance = null;
    await this.destroyGameMode('local');
  }

  async setupGameMode(hillName: LittleMuncherHills) {
    if (!ReferenceHolder.gameInstance) return;
    if (this.serverHealthService.serverAvailable) {
      const url = environment.api + 'api/little-muncher/create-game-mode';
      const body: LittleMuncherGameModeCreateDto = { gameInstanceId: ReferenceHolder.gameInstance.id, hillName };
      await firstValueFrom(this.httpClient.post<void>(url, body));
    }
    ReferenceHolder.gameModeRef = new LittleMuncherGameMode(hillName);
  }

  /**
   * @param removeFrom - if we destroy whole game instance, we don't need to remove game mode from remote again
   */
  async destroyGameMode(removeFrom: 'local' | 'localAndRemote'): Promise<void> {
    if (!ReferenceHolder.gameInstance || !ReferenceHolder.gameModeRef) return;
    if (this.serverHealthService.serverAvailable && removeFrom === 'localAndRemote') {
      const url = environment.api + 'api/little-muncher/destroy-game-mode';
      const body: LittleMuncherGameModeCreateDto = {
        gameInstanceId: ReferenceHolder.gameInstance.id,
        hillName: ReferenceHolder.gameModeRef.hillToClimbOn
      };
      await firstValueFrom(this.httpClient.delete<void>(url, { body }));
    }
    ReferenceHolder.gameModeRef = null;
  }
}
