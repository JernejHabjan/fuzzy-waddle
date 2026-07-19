import { WebSocketGateway, WebSocketServer, type OnGatewayConnection } from "@nestjs/websockets";
import {
  LittleMuncherGatewayEvent,
  type LittleMuncherRoomEvent,
  type LittleMuncherSpectatorEvent
} from "@fuzzy-waddle/little-muncher-protocol";
import { type GameInstanceGatewayInterface } from "./game-instance.gateway.interface";
import { Server, Socket } from "socket.io";
import { SocketConnectionAuthService } from "@fuzzy-waddle/platform-identity/server/auth/socket-connection-auth.service";

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",")
  }
})
export class GameInstanceGateway implements GameInstanceGatewayInterface, OnGatewayConnection {
  @WebSocketServer() private readonly server!: Server;

  constructor(private readonly socketConnectionAuthService: SocketConnectionAuthService) {}

  async handleConnection(client: Socket): Promise<void> {
    await this.socketConnectionAuthService.disconnectUnauthenticatedClient(client);
  }

  emitRoom(roomEvent: LittleMuncherRoomEvent): void {
    this.server.emit(LittleMuncherGatewayEvent.LittleMuncherRoom, roomEvent);
  }

  emitSpectator(spectatorEvent: LittleMuncherSpectatorEvent): void {
    // todo??? this.server.emit(LittleMuncherGatewayEvent.Spectator, spectatorEvent);
  }
}
