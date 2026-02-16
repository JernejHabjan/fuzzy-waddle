import { computed, inject, Injectable, type Signal, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import {
  GameSessionState,
  ProbableWaffleGameInstanceType,
  ProbableWaffleGatewayEvent,
  type ProbableWaffleGetRoomsDto,
  ProbableWaffleMapEnum,
  type ProbableWaffleRoom,
  type ProbableWaffleRoomEvent
} from "@fuzzy-waddle/api-interfaces";
import { firstValueFrom, Observable, Subscription } from "rxjs";
import { AuthenticatedSocketService } from "../../../data-access/chat/authenticated-socket.service";
import { map } from "rxjs/operators";
import { AuthService } from "../../../auth/auth.service";
import { ServerHealthService } from "../../../shared/services/server-health.service";
import { type RoomsServiceInterface } from "./rooms.service.interface";

@Injectable({
  providedIn: "root"
})
export class RoomsService implements RoomsServiceInterface {
  private roomsSubscription?: Subscription;
  private isInitialized = false;
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
    if (!roomEvent) {
      console.error("[RoomsService] Failed to get room event observable - socket may not be connected");
      return;
    }
    // console.log("[RoomsService] Subscribing to room events");
    this.roomsSubscription = roomEvent.subscribe(async (roomEvent) => {
      // console.log("[RoomsService] Room event received:", roomEvent.action, roomEvent.room.gameInstanceMetadataData.gameInstanceId);
      const room = roomEvent.room;
      const rooms = this.rooms();
      const roomLocally = rooms.find(
        (r) => r.gameInstanceMetadataData.gameInstanceId === roomEvent.room.gameInstanceMetadataData.gameInstanceId
      );
      switch (roomEvent.action) {
        case "added":
          // console.log("[RoomsService] Adding room:", room.gameInstanceMetadataData.gameInstanceId);
          this.rooms.update((rooms) => [...rooms, room]);
          break;
        case "removed":
          // console.log("[RoomsService] Removing room:", room.gameInstanceMetadataData.gameInstanceId);
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
          if (!roomLocally) {
            console.warn(
              "[RoomsService] Received update for room not in local list:",
              room.gameInstanceMetadataData.gameInstanceId
            );
            return;
          }
          // console.log("[RoomsService] Updating room:", room.gameInstanceMetadataData.gameInstanceId);
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
    if (!this.authService.isAuthenticated || !this.serverHealthService.serverAvailable) {
      console.warn("[RoomsService] Cannot fetch rooms - not authenticated or server unavailable");
      return [];
    }
    const url = environment.api + "api/probable-waffle/get-rooms";
    const body: ProbableWaffleGetRoomsDto = {
      maps: maps
    };
    try {
      // noinspection UnnecessaryLocalVariableJS
      const rooms = await firstValueFrom(this.httpClient.post<ProbableWaffleRoom[]>(url, body));
      // console.log("[RoomsService] Fetched rooms:", rooms.length);
      return rooms;
    } catch (error) {
      console.error("[RoomsService] Failed to fetch rooms:", error);
      return [];
    }
  }

  async init(): Promise<void> {
    // If already initialized and subscribed, just refresh the rooms
    if (this.isInitialized && this.roomsSubscription && !this.roomsSubscription.closed) {
      // console.log("[RoomsService] Already initialized, refreshing rooms");
      await this.initiallyPullRooms();
      return;
    }

    // console.log("[RoomsService] Initializing rooms service");
    await this.initiallyPullRooms();
    await this.listenToRoomEvents();
    this.isInitialized = true;
  }

  async initiallyPullRooms(): Promise<void> {
    const rooms = await this.getRooms();
    this.rooms.set(rooms);
    // console.log("[RoomsService] Set rooms to:", rooms.length);
  }

  private async getRoomEvent(): Promise<Observable<ProbableWaffleRoomEvent> | undefined> {
    const socket = await this.authenticatedSocketService.getSocket();
    return socket
      ?.fromEvent<ProbableWaffleRoomEvent, any>(ProbableWaffleGatewayEvent.ProbableWaffleRoom)
      .pipe(map((roomEvent: ProbableWaffleRoomEvent) => roomEvent));
  }

  destroy(): void {
    // console.log("[RoomsService] Destroy called - unsubscribing from room events");
    this.roomsSubscription?.unsubscribe();
    // Don't clear rooms since this is a singleton service
    // Rooms will be refreshed on next init()
  }
}
