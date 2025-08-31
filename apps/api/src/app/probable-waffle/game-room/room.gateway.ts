import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { ProbableWaffleGatewayEvent, type ProbableWaffleRoomEvent } from "@fuzzy-waddle/api-interfaces";
import { Server } from "socket.io";

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",")
  }
})
export class RoomGateway {
  @WebSocketServer() private readonly server: Server;

  emitRoom(roomEvent: ProbableWaffleRoomEvent) {
    this.server.emit(ProbableWaffleGatewayEvent.ProbableWaffleRoom, roomEvent);
  }
}
