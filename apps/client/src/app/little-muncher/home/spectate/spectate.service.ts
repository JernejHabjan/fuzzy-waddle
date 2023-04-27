import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import {
  GatewayEvent,
  LittleMuncherGameInstance,
  LittleMuncherHills,
  Room,
  RoomEvent
} from '@fuzzy-waddle/api-interfaces';
import { firstValueFrom, Observable } from 'rxjs';
import { AuthenticatedSocketService } from '../../../data-access/chat/authenticated-socket.service';
import { Socket } from 'ngx-socket-io';
import { map } from 'rxjs/operators';
import { GameInstanceClientService } from '../../main/game-instance-client.service';

@Injectable({
  providedIn: 'root'
})
export class SpectateService {
  private authenticatedSocket: Socket;

  constructor(
    private readonly httpClient: HttpClient,
    private readonly authenticatedSocketService: AuthenticatedSocketService,
    private readonly gameInstanceClientService: GameInstanceClientService
  ) {
    this.authenticatedSocket = this.authenticatedSocketService.createAuthSocket(); // todo this needs to be constructed only when the user is authenticated
  }

  async getRooms() {
    const url = environment.api + 'api/little-muncher/get-rooms';
    return await firstValueFrom(this.httpClient.get<Room[]>(url));
  }

  get roomEvent(): Observable<RoomEvent> {
    return this.authenticatedSocket
      .fromEvent<RoomEvent>(GatewayEvent.LittleMuncherRoom)
      .pipe(map((data: RoomEvent) => data));
  }

  async joinRoom(gameInstanceId: string) {
    // create post with LittleMuncherGameInstance dto
    const url = environment.api + 'api/little-muncher/spectator-join';
    await firstValueFrom(
      this.httpClient.post(url, {
        gameInstanceId
      } as LittleMuncherGameInstance)
    );

    this.gameInstanceClientService.openGameInstance(gameInstanceId);
    this.gameInstanceClientService.openLevel({
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
