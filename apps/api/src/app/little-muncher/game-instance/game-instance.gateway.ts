import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "net";
import {
  GatewaySpectatorEvent,
  LittleMuncherGatewayEvent,
  RoomEvent,
  SpectatorEvent
} from "@fuzzy-waddle/api-interfaces";
import { GameInstanceGatewayInterface } from "./game-instance.gateway.interface";

export const GameInstanceGatewayStub = {
  emitRoom(roomEvent: RoomEvent) {
    //
  },
  emitSpectator(spectatorEvent: SpectatorEvent) {
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

  emitRoom(roomEvent: RoomEvent) {
    this.server.emit(LittleMuncherGatewayEvent.LittleMuncherRoom, roomEvent);
  }

  emitSpectator(spectatorEvent: SpectatorEvent) {
    this.server.emit(GatewaySpectatorEvent.Spectator, spectatorEvent);
  }
}
