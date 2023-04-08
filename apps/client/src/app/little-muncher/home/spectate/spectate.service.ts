import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { GatewayEvent, SpectatorRoom } from '@fuzzy-waddle/api-interfaces';
import { firstValueFrom, Observable } from 'rxjs';
import { AuthenticatedSocketService } from '../../../data-access/chat/authenticated-socket.service';
import { Socket } from 'ngx-socket-io';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SpectateService {
  private authenticatedSocket: Socket;

  constructor(
    private readonly httpClient: HttpClient,
    private readonly authenticatedSocketService: AuthenticatedSocketService
  ) {
    this.authenticatedSocket = this.authenticatedSocketService.createAuthSocket(); // todo this needs to be constructed only when the user is authenticated
  }

  async getSpectatorRooms() {
    const url = environment.api + 'api/little-muncher/get-spectator-rooms';
    return await firstValueFrom(this.httpClient.get<SpectatorRoom[]>(url));
  }

  get spectatorRoomEvent(): Observable<SpectatorRoom> {
    return this.authenticatedSocket
      .fromEvent<SpectatorRoom>(GatewayEvent.LittleMuncherSpectateRoom)
      .pipe(map((data: SpectatorRoom) => data));
  }
}
