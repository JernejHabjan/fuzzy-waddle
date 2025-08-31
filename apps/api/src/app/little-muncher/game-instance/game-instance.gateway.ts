import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "net";
import {
  LittleMuncherGatewayEvent,
  type LittleMuncherRoomEvent,
  type LittleMuncherSpectatorEvent
} from "@fuzzy-waddle/api-interfaces";
import { type GameInstanceGatewayInterface } from "./game-instance.gateway.interface";

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
  @WebSocketServer() private readonly server!: Server;

  emitRoom(roomEvent: LittleMuncherRoomEvent): void {
    this.server.emit(LittleMuncherGatewayEvent.LittleMuncherRoom, roomEvent);
  }

  emitSpectator(spectatorEvent: LittleMuncherSpectatorEvent): void {
    // todo??? this.server.emit(LittleMuncherGatewayEvent.Spectator, spectatorEvent);
  }
}
