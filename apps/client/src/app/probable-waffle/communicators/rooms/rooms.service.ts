import { computed, inject, Injectable, Signal, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import {
  GameSessionState,
  ProbableWaffleGameInstanceType,
  ProbableWaffleGatewayEvent,
  ProbableWaffleGetRoomsDto,
  ProbableWaffleMapEnum,
  ProbableWaffleRoom,
  ProbableWaffleRoomEvent
} from "@fuzzy-waddle/api-interfaces";
import { firstValueFrom, Observable, Subscription } from "rxjs";
import { AuthenticatedSocketService } from "../../../data-access/chat/authenticated-socket.service";
import { map } from "rxjs/operators";
import { AuthService } from "../../../auth/auth.service";
import { ServerHealthService } from "../../../shared/services/server-health.service";
import { RoomsServiceInterface } from "./rooms.service.interface";

@Injectable({
  providedIn: "root"
})
export class RoomsService implements RoomsServiceInterface {
  private roomsSubscription?: Subscription;
  rooms = signal<ProbableWaffleRoom[]>([]);

  private readonly authService = inject(AuthService);
  private readonly httpClient = inject(HttpClient);
  private readonly serverHealthService = inject(ServerHealthService);
  private readonly authenticatedSocketService = inject(AuthenticatedSocketService);

  playersSearchingForMatchmakingGame: Signal<number> = computed(() => {
    // noinspection UnnecessaryLocalVariableJS
    const rooms = this.rooms().filter(
      (room) =>
        room.gameInstanceMetadataData.type === ProbableWaffleGameInstanceType.Matchmaking &&
        room.gameInstanceMetadataData.createdBy !== this.authService.userId &&
        room.gameInstanceMetadataData.sessionState === GameSessionState.NotStarted
    ).length;
    return rooms;
  });

  matchmakingGamesInProgress: Signal<number> = computed(() => {
    // noinspection UnnecessaryLocalVariableJS
    const rooms = this.rooms().filter(
      (room) =>
        room.gameInstanceMetadataData.type === ProbableWaffleGameInstanceType.Matchmaking &&
        room.gameInstanceMetadataData.createdBy !== this.authService.userId &&
        room.gameInstanceMetadataData.sessionState !== GameSessionState.NotStarted &&
        room.gameInstanceMetadataData.sessionState !== GameSessionState.Finished
    ).length;
    return rooms;
  });

  /**
   * we need to listen to room events, so we know if we're spectating a room that is removed
   */
  listenToRoomEvents() {
    this.roomsSubscription = this.roomEvent?.subscribe(async (roomEvent) => {
      const room = roomEvent.room;
      switch (roomEvent.action) {
        case "added":
          if (roomEvent.room.gameInstanceMetadataData.createdBy === this.authService.userId) return;
          this.rooms.update((rooms) => [...rooms, room]);
          break;
        case "removed":
          this.rooms.update((rooms) =>
            rooms.filter(
              (room) =>
                room.gameInstanceMetadataData.gameInstanceId !== roomEvent.room.gameInstanceMetadataData.gameInstanceId
            )
          );
          break;
        case "changed":
          this.rooms.update((rooms) =>
            rooms.map((r) => {
              if (
                r.gameInstanceMetadataData.gameInstanceId === roomEvent.room.gameInstanceMetadataData.gameInstanceId
              ) {
                return room;
              }
              return r;
            })
          );
          break;
      }
    });
  }

  async getRooms(maps: ProbableWaffleMapEnum[] | null = null): Promise<ProbableWaffleRoom[]> {
    if (!this.authService.isAuthenticated || !this.serverHealthService.serverAvailable) return [];
    const url = environment.api + "api/probable-waffle/get-rooms";
    const body: ProbableWaffleGetRoomsDto = {
      maps: maps
    };
    return await firstValueFrom(this.httpClient.post<ProbableWaffleRoom[]>(url, body));
  }

  async init(): Promise<void> {
    await this.initiallyPullRooms();
    this.listenToRoomEvents();
  }

  async initiallyPullRooms(): Promise<void> {
    this.rooms.set(await this.getRooms());
  }

  get roomEvent(): Observable<ProbableWaffleRoomEvent> | undefined {
    const socket = this.authenticatedSocketService.socket;
    return socket
      ?.fromEvent<ProbableWaffleRoomEvent>(ProbableWaffleGatewayEvent.ProbableWaffleRoom)
      .pipe(map((roomEvent: ProbableWaffleRoomEvent) => roomEvent));
  }

  destroy(): void {
    this.roomsSubscription?.unsubscribe();
    this.rooms.set([]);
  }
}
