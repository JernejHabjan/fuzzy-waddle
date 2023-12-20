import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import {
  GameInstanceDataDto,
  LittleMuncherGatewayEvent,
  ProbableWaffleGameInstanceData,
  Room,
  RoomEvent
} from "@fuzzy-waddle/api-interfaces";
import { firstValueFrom, Observable, Subscription } from "rxjs";
import { AuthenticatedSocketService } from "../../../data-access/chat/authenticated-socket.service";
import { map } from "rxjs/operators";
import { AuthService } from "../../../auth/auth.service";
import { ServerHealthService } from "../../../shared/services/server-health.service";
import { RoomsServiceInterface } from "./rooms.service.interface";
import { GameInstanceClientService } from "../game-instance-client.service";

@Injectable({
  providedIn: "root"
})
export class RoomsService implements RoomsServiceInterface {
  private roomsSubscription?: Subscription;
  rooms: Room[] = [];

  constructor(
    private readonly authService: AuthService,
    private readonly httpClient: HttpClient,
    private readonly serverHealthService: ServerHealthService,
    private readonly authenticatedSocketService: AuthenticatedSocketService,
    private readonly gameInstanceClientService: GameInstanceClientService
  ) {}

  /**
   * we need to listen to room events, so we know if we're spectating a room that is removed
   */
  listenToRoomEvents() {
    this.roomsSubscription = this.roomEvent?.subscribe(async (roomEvent) => {
      const room = roomEvent.room;
      if (roomEvent.action === "added") {
        if (roomEvent.gameInstanceMetadataData.createdBy === this.authService.userId) return;
        this.rooms.push(room);
      } else if (roomEvent.action === "removed") {
        this.rooms = this.rooms.filter((room) => room.gameInstanceId !== room.gameInstanceId);
      }
    });
  }

  async getRooms() {
    if (!this.authService.isAuthenticated || !this.serverHealthService.serverAvailable) return [];
    const url = environment.api + "api/probable-waffle/get-rooms";
    return await firstValueFrom(this.httpClient.get<Room[]>(url));
  }

  async initiallyPullRooms(): Promise<void> {
    this.rooms = await this.getRooms();
  }

  get roomEvent(): Observable<RoomEvent> | undefined {
    const socket = this.authenticatedSocketService.socket;
    return socket
      ?.fromEvent<RoomEvent>(LittleMuncherGatewayEvent.LittleMuncherRoom)
      .pipe(map((data: RoomEvent) => data));
  }

  async joinRoom(gameInstanceId: string) {
    // create post with LittleMuncherGameInstance dto
    const url = environment.api + "api/probable-waffle/spectator-join";
    const gameInstance = await firstValueFrom(
      this.httpClient.post<ProbableWaffleGameInstanceData>(url, {
        gameInstanceId
      } satisfies GameInstanceDataDto)
    );
    this.gameInstanceClientService.openLevelSpectator(gameInstance);
  }

  async joinRoomSpectator(gameInstanceId: string) {
    // create post with LittleMuncherGameInstance dto
    const url = environment.api + "api/probable-waffle/spectator-join";
    const gameInstance = await firstValueFrom(
      this.httpClient.post<ProbableWaffleGameInstanceData>(url, {
        gameInstanceId
      } satisfies GameInstanceDataDto)
    );
    this.gameInstanceClientService.openLevelSpectator(gameInstance);
  }

  // todo use
  async leaveRoom(gameInstanceId: string) {
    // create post with LittleMuncherGameInstance dto
    const url = environment.api + "api/probable-waffle/spectator-leave";
    await firstValueFrom(
      this.httpClient.delete(url, {
        body: {
          gameInstanceId
        } satisfies GameInstanceDataDto
      })
    );
  }

  destroy(): void {
    this.roomsSubscription?.unsubscribe();
    this.rooms = [];
  }
}
