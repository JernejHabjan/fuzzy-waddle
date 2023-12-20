import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "net";
import {
  GatewaySpectatorEvent,
  ProbableWaffleGatewayEvent,
  ProbableWaffleRoomEvent,
  ProbableWaffleSpectatorEvent
} from "@fuzzy-waddle/api-interfaces";
import { GameInstanceGatewayInterface } from "./game-instance.gateway.interface";

export const GameInstanceGatewayStub = {
  emitRoom(roomEvent: ProbableWaffleRoomEvent) {
    //
  },
  emitSpectator(spectatorEvent: ProbableWaffleSpectatorEvent) {
    //
  }
} satisfies GameInstanceGatewayInterface;

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",")
  }
})
export class GameInstanceGateway implements GameInstanceGatewayInterface {
  @WebSocketServer()
  private server: Server;

  emitRoom(roomEvent: ProbableWaffleRoomEvent) {
    this.server.emit(ProbableWaffleGatewayEvent.ProbableWaffleRoom, roomEvent);
  }

  emitSpectator(spectatorEvent: ProbableWaffleSpectatorEvent) {
    this.server.emit(GatewaySpectatorEvent.Spectator, spectatorEvent);
  }
}
