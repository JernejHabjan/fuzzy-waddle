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
        room.gameInstanceMetadataData.sessionState !== GameSessionState.Stopped
    ).length;
    return rooms;
  });

  /**
   * we need to listen to room events, so we know if we're spectating a room that is removed
   */
  async listenToRoomEvents() {
    const roomEvent = await this.getRoomEvent();
    this.roomsSubscription = roomEvent?.subscribe(async (roomEvent) => {
      const room = roomEvent.room;
      const rooms = this.rooms();
      const roomLocally = rooms.find(
        (r) => r.gameInstanceMetadataData.gameInstanceId === roomEvent.room.gameInstanceMetadataData.gameInstanceId
      );
      switch (roomEvent.action) {
        case "added":
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
        case "player.joined":
        case "player.left":
        case "spectator.joined":
        case "spectator.left":
        case "game_instance_metadata":
        case "game_mode":
          if (!roomLocally) return;
          roomLocally.gameInstanceMetadataData = roomEvent.room.gameInstanceMetadataData;
          roomLocally.gameModeData = roomEvent.room.gameModeData;
          roomLocally.players = roomEvent.room.players;
          roomLocally.spectators = roomEvent.room.spectators;
          this.rooms.update((rooms) => [...rooms]);
          break;
        default:
          throw new Error("Unknown room event action: " + roomEvent.action);
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
    await this.listenToRoomEvents();
  }

  async initiallyPullRooms(): Promise<void> {
    this.rooms.set(await this.getRooms());
  }

  private async getRoomEvent(): Promise<Observable<ProbableWaffleRoomEvent> | undefined> {
    const socket = await this.authenticatedSocketService.getSocket();
    return socket
      ?.fromEvent<ProbableWaffleRoomEvent>(ProbableWaffleGatewayEvent.ProbableWaffleRoom)
      .pipe(map((roomEvent: ProbableWaffleRoomEvent) => roomEvent));
  }

  destroy(): void {
    this.roomsSubscription?.unsubscribe();
    this.rooms.set([]);
  }
}
