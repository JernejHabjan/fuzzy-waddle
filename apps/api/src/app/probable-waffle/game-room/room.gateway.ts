import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import {
  ProbableWaffleGatewayEvent,
  ProbableWaffleGatewayRoomTypes,
  type ProbableWaffleRoomEvent
} from "@fuzzy-waddle/api-interfaces";
import { Server, Socket } from "socket.io";
import { SocketConnectionAuthService } from "../../../auth/socket-connection-auth.service";

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",")
  }
})
export class RoomGateway implements OnGatewayConnection {
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
