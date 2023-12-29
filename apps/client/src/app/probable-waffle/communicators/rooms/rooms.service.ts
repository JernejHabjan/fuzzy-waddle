import { Injectable } from "@angular/core";
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
import { GameInstanceClientService } from "../game-instance-client.service";

@Injectable({
  providedIn: "root"
})
export class RoomsService implements RoomsServiceInterface {
  private roomsSubscription?: Subscription;
  rooms: ProbableWaffleRoom[] = [];

  constructor(
    private readonly authService: AuthService,
    private readonly httpClient: HttpClient,
    private readonly serverHealthService: ServerHealthService,
    private readonly authenticatedSocketService: AuthenticatedSocketService,
    private readonly gameInstanceClientService: GameInstanceClientService
  ) {}

  get playersSearchingForMatchmakingGame(): number {
    return this.rooms.filter(
      (room) =>
        room.gameInstanceMetadataData.type === ProbableWaffleGameInstanceType.Matchmaking &&
        room.gameInstanceMetadataData.createdBy !== this.authService.userId &&
        room.players.length < room.gameMode.data.maxPlayers
    ).length;
  }

  get matchmakingGamesInProgress(): number {
    return this.rooms.filter(
      (room) =>
        room.gameInstanceMetadataData.type === ProbableWaffleGameInstanceType.Matchmaking &&
        room.gameInstanceMetadataData.createdBy !== this.authService.userId &&
        room.gameInstanceMetadataData.sessionState !== GameSessionState.NotStarted &&
        room.gameInstanceMetadataData.sessionState !== GameSessionState.Finished
    ).length;
  }

  /**
   * we need to listen to room events, so we know if we're spectating a room that is removed
   */
  listenToRoomEvents() {
    this.roomsSubscription = this.roomEvent?.subscribe(async (roomEvent) => {
      const room = roomEvent.room;
      switch (roomEvent.action) {
        case "added":
          if (roomEvent.room.gameInstanceMetadataData.createdBy === this.authService.userId) return;
          this.rooms.push(room);
          break;
        case "removed":
          this.rooms = this.rooms.filter(
            (room) =>
              room.gameInstanceMetadataData.gameInstanceId !== roomEvent.room.gameInstanceMetadataData.gameInstanceId
          );
          break;
        case "changed":
          const index = this.rooms.findIndex(
            (room) =>
              room.gameInstanceMetadataData.gameInstanceId === roomEvent.room.gameInstanceMetadataData.gameInstanceId
          );
          if (index !== -1) {
            this.rooms[index] = room;
          }
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
    this.rooms = await this.getRooms();
  }

  get roomEvent(): Observable<ProbableWaffleRoomEvent> | undefined {
    const socket = this.authenticatedSocketService.socket;
    return socket
      ?.fromEvent<ProbableWaffleRoomEvent>(ProbableWaffleGatewayEvent.ProbableWaffleRoom)
      .pipe(map((roomEvent: ProbableWaffleRoomEvent) => roomEvent));
  }

  async joinRoom(gameInstanceId: string) {
    await this.gameInstanceClientService.joinToLobbyAsSpectator(gameInstanceId);
  }

  async joinRoomSpectator(gameInstanceId: string) {
    await this.gameInstanceClientService.joinToLobbyAsSpectator(gameInstanceId);
  }

  // todo use
  async leaveRoom(gameInstanceId: string) {
    // todo
  }

  destroy(): void {
    this.roomsSubscription?.unsubscribe();
    this.rooms = [];
  }
}
