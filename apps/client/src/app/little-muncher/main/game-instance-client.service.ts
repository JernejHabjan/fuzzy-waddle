import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import {
  LittleMuncherGameInstanceCreateDto,
  LittleMuncherGameModeCreateDto,
  LittleMuncherHills
} from '@fuzzy-waddle/api-interfaces';
import { ReferenceHolder } from '../game/reference-holder';
import { GameInstance } from '../game/framework/game-instance';
import { LittleMuncherGameMode } from '../game/framework/game-mode';

@Injectable({
  providedIn: 'root'
})
export class GameInstanceClientService {
  constructor(private readonly httpClient: HttpClient) {}

  async createGameInstance(): Promise<void> {
    ReferenceHolder.gameInstance = new GameInstance();
    const url = environment.api + 'api/little-muncher/create-game-instance';
    const body: LittleMuncherGameInstanceCreateDto = { gameInstanceId: ReferenceHolder.gameInstance.id };
    return await firstValueFrom(this.httpClient.post<void>(url, body));
  }

  async destroyGameInstance() {
    if (!ReferenceHolder.gameInstance) return;
    const url = environment.api + 'api/little-muncher/destroy-game-instance';
    const body: LittleMuncherGameInstanceCreateDto = { gameInstanceId: ReferenceHolder.gameInstance.id };
    await firstValueFrom(this.httpClient.delete<void>(url, { body }));
    ReferenceHolder.gameInstance = null;
    ReferenceHolder.gameModeRef = null;
  }

  async setupGameMode(hillName: LittleMuncherHills) {
    if (!ReferenceHolder.gameInstance) return;
    const url = environment.api + 'api/little-muncher/create-game-mode';
    const body: LittleMuncherGameModeCreateDto = { gameInstanceId: ReferenceHolder.gameInstance.id, hillName };
    await firstValueFrom(this.httpClient.post<void>(url, body));
    ReferenceHolder.gameModeRef = new LittleMuncherGameMode(hillName);
  }
}
