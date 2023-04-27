import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import {
  LittleMuncherGameInstance,
  LittleMuncherGameSessionInstance,
  LittleMuncherGatewayEvent,
  LittleMuncherHills,
  Room,
  RoomEvent
} from '@fuzzy-waddle/api-interfaces';
import { firstValueFrom, Observable } from 'rxjs';
import { AuthenticatedSocketService } from '../../../data-access/chat/authenticated-socket.service';
import { map } from 'rxjs/operators';
import { GameInstanceClientService } from '../../main/game-instance-client.service';

@Injectable({
  providedIn: 'root'
})
export class SpectateService {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly authenticatedSocketService: AuthenticatedSocketService,
    private readonly gameInstanceClientService: GameInstanceClientService
  ) {}

  async getRooms() {
    const url = environment.api + 'api/little-muncher/get-rooms';
    return await firstValueFrom(this.httpClient.get<Room[]>(url));
  }

  get roomEvent(): Observable<RoomEvent> | undefined {
    const socket = this.authenticatedSocketService.socket;
    return socket
      ?.fromEvent<RoomEvent>(LittleMuncherGatewayEvent.LittleMuncherRoom)
      .pipe(map((data: RoomEvent) => data));
  }

  async joinRoom(gameSessionInstance: LittleMuncherGameSessionInstance, gameInstanceId: string) {
    // create post with LittleMuncherGameInstance dto
    const url = environment.api + 'api/little-muncher/spectator-join';
    await firstValueFrom(
      this.httpClient.post(url, {
        gameInstanceId
      } as LittleMuncherGameInstance)
    );

    this.gameInstanceClientService.openGameInstance(gameSessionInstance, gameInstanceId);
    this.gameInstanceClientService.openLevel(gameSessionInstance, {
      hillName: LittleMuncherHills.Jakob // todo pull from server which level to join
    });
  }

  // todo use
  async leaveRoom(gameInstanceId: string) {
    // create post with LittleMuncherGameInstance dto
    const url = environment.api + 'api/little-muncher/spectator-leave';
    await firstValueFrom(
      this.httpClient.delete(url, {
        body: {
          gameInstanceId
        } as LittleMuncherGameInstance
      })
    );
  }
}
