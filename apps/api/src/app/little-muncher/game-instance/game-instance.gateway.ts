import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import {
  LittleMuncherGatewayEvent,
  type LittleMuncherRoomEvent,
  type LittleMuncherSpectatorEvent
} from "@fuzzy-waddle/api-interfaces";
import { type GameInstanceGatewayInterface } from "./game-instance.gateway.interface";
import { Server, Socket } from "socket.io";
import { SocketConnectionAuthService } from "../../../auth/socket-connection-auth.service";

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
