import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import {
  type GameInstanceDataDto,
  type LittleMuncherGameInstanceData,
  LittleMuncherGatewayEvent,
  type LittleMuncherRoom,
  type LittleMuncherRoomEvent
} from "@fuzzy-waddle/api-interfaces";
import { firstValueFrom, Observable, Subject, Subscription } from "rxjs";
import { AuthenticatedSocketService } from "../../../data-access/chat/authenticated-socket.service";
import { map } from "rxjs/operators";
import { AuthService } from "../../../auth/auth.service";
import { ServerHealthService } from "../../../shared/services/server-health.service";
import { type SpectateServiceInterface } from "./spectate.service.interface";
import { GameInstanceClientService } from "../../main/communicators/game-instance-client.service";

@Injectable({
  providedIn: "root"
})
export class SpectateService implements SpectateServiceInterface {
  private readonly authService = inject(AuthService);
  private readonly httpClient = inject(HttpClient);
  private readonly serverHealthService = inject(ServerHealthService);
  private readonly authenticatedSocketService = inject(AuthenticatedSocketService);
  private readonly gameInstanceClientService = inject(GameInstanceClientService);

  private spectateRoomsSubscription?: Subscription;
  rooms: LittleMuncherRoom[] = [];
  spectatorDisconnected: Subject<void> = new Subject<void>();

  /**
   * we need to listen to room events, so we know if we're spectating a room that is removed
   */
  async listenToRoomEvents() {
    const roomEvent = await this.getRoomEvent();
    this.spectateRoomsSubscription = roomEvent?.subscribe(async (roomEvent) => {
      const room = roomEvent.room;
      if (roomEvent.action === "added") {
        if (roomEvent.room.gameInstanceMetadataData.createdBy === this.authService.userId) return;
        this.rooms.push(room);
      } else if (roomEvent.action === "removed") {
        this.rooms = this.rooms.filter(
          (room) =>
            room.gameInstanceMetadataData.gameInstanceId !== roomEvent.room.gameInstanceMetadataData.gameInstanceId
        );
        await this.handleRemovalOfSpectatedRoom(room);
      }
    });
  }

  private async handleRemovalOfSpectatedRoom(room: LittleMuncherRoom) {
    const currentGameInstanceId =
      this.gameInstanceClientService.gameInstance?.gameInstanceMetadata?.data.gameInstanceId;
    if (!currentGameInstanceId) return;

    // check if we're spectating the room that was removed
    const currentlySpectating = this.gameInstanceClientService.gameInstance!.isSpectator(this.authService.userId);
    if (!currentlySpectating) return;

    // check if spectated room is the same as the room that was removed
    if (room.gameInstanceMetadataData.gameInstanceId !== currentGameInstanceId) return;

    await this.gameInstanceClientService.stopLevel("local");

    this.spectatorDisconnected.next();
  }

  async getRooms() {
    if (!this.authService.isAuthenticated || !this.serverHealthService.serverAvailable) return [];
    const url = environment.api + "api/little-muncher/get-rooms";
    return await firstValueFrom(this.httpClient.get<LittleMuncherRoom[]>(url));
  }

  async initiallyPullRooms(): Promise<void> {
    this.rooms = await this.getRooms();
  }

  async getRoomEvent(): Promise<Observable<LittleMuncherRoomEvent> | undefined> {
    const socket = await this.authenticatedSocketService.getSocket();
    return socket
      ?.fromEvent<LittleMuncherRoomEvent, any>(LittleMuncherGatewayEvent.LittleMuncherRoom)
      .pipe(map((data: LittleMuncherRoomEvent) => data));
  }

  async joinRoom(gameInstanceId: string) {
    // create post with LittleMuncherGameInstance dto
    const url = environment.api + "api/little-muncher/spectator-join";
    const gameInstance = await firstValueFrom(
      this.httpClient.post<LittleMuncherGameInstanceData>(url, {
        gameInstanceId
      } satisfies GameInstanceDataDto)
    );
    await this.gameInstanceClientService.openLevelSpectator(gameInstance);
  }

  // todo use
  async leaveRoom(gameInstanceId: string) {
    // create post with LittleMuncherGameInstance dto
    const url = environment.api + "api/little-muncher/spectator-leave";
    await firstValueFrom(
      this.httpClient.delete(url, {
        body: {
          gameInstanceId
        } satisfies GameInstanceDataDto
      })
    );
  }

  destroy(): void {
    this.spectateRoomsSubscription?.unsubscribe();
    this.rooms = [];
  }
}
