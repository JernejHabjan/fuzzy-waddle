import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "net";
import {
  LittleMuncherGatewayEvent,
  LittleMuncherRoomEvent,
  LittleMuncherSpectatorEvent,
  ProbableWaffleGameInstanceEvent
} from "@fuzzy-waddle/api-interfaces";
import { GameInstanceGatewayInterface } from "./game-instance.gateway.interface";

export const GameInstanceGatewayStub = {
  emitRoom(roomEvent: LittleMuncherRoomEvent) {
    //
  },
  emitSpectator(spectatorEvent: LittleMuncherSpectatorEvent) {
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

  emitRoom(roomEvent: LittleMuncherRoomEvent) {
    this.server.emit(LittleMuncherGatewayEvent.LittleMuncherRoom, roomEvent);
  }

  emitSpectator(spectatorEvent: LittleMuncherSpectatorEvent) {
    this.server.emit(ProbableWaffleGameInstanceEvent.Spectator, spectatorEvent);
  }
}
