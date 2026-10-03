import { WebSocketGateway, WebSocketServer, type OnGatewayConnection } from "@nestjs/websockets";
import {
  ProbableWaffleGatewayEvent,
  ProbableWaffleGatewayRoomTypes,
  type ProbableWaffleRoomEvent
} from "@fuzzy-waddle/probable-waffle-protocol";
import { Server, Socket } from "socket.io";
import { SocketConnectionAuthService } from "@fuzzy-waddle/platform-identity/server/auth/socket-connection-auth.service";
import { type RoomGatewayInterface } from "./room.gateway.interface";

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",")
  }
})
export class RoomGateway implements OnGatewayConnection, RoomGatewayInterface {
  @WebSocketServer() private readonly server!: Server;

  constructor(private readonly socketConnectionAuthService: SocketConnectionAuthService) {}

  async handleConnection(client: Socket): Promise<void> {
    await this.socketConnectionAuthService.disconnectUnauthenticatedClient(client);
  }

  emitRoom(roomEvent: ProbableWaffleRoomEvent) {
    this.server.emit(ProbableWaffleGatewayEvent.ProbableWaffleRoom, roomEvent);
  }

  emitRoomToGameInstance(gameInstanceId: string, roomEvent: ProbableWaffleRoomEvent) {
    this.server
      .to(`${ProbableWaffleGatewayRoomTypes.ProbableWaffleGameInstance}${gameInstanceId}`)
      .emit(ProbableWaffleGatewayEvent.ProbableWaffleRoom, roomEvent);
  }
}
