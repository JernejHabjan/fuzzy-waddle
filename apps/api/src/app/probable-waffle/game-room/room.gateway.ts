import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { ProbableWaffleGatewayEvent, type ProbableWaffleRoomEvent } from "@fuzzy-waddle/api-interfaces";
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
    const authenticated = await this.socketConnectionAuthService.authenticateSocket(client);
    if (!authenticated) {
      client.disconnect(true);
    }
  }

  emitRoom(roomEvent: ProbableWaffleRoomEvent) {
    this.server.emit(ProbableWaffleGatewayEvent.ProbableWaffleRoom, roomEvent);
  }
}
