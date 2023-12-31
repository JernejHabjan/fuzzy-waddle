import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import {
  ProbableWaffleGameFoundEvent,
  ProbableWaffleGameInstanceEvent,
  ProbableWaffleGatewayEvent,
  ProbableWaffleLevelStateChangeEvent,
  ProbableWafflePlayerEvent,
  ProbableWaffleRoomEvent,
  ProbableWaffleSpectatorEvent
} from "@fuzzy-waddle/api-interfaces";
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

  emitLevelStateChange(levelStateChange: ProbableWaffleLevelStateChangeEvent) {
    this.server.emit(ProbableWaffleGameInstanceEvent.LevelStateChange, levelStateChange);
  }

  emitPlayer(playerEvent: ProbableWafflePlayerEvent) {
    this.server.emit(ProbableWaffleGameInstanceEvent.Player, playerEvent);
  }

  emitSpectator(spectatorEvent: ProbableWaffleSpectatorEvent) {
    this.server.emit(ProbableWaffleGameInstanceEvent.Spectator, spectatorEvent);
  }

  emitGameFound(probableWaffleGameFoundEvent: ProbableWaffleGameFoundEvent) {
    this.server.emit(ProbableWaffleGameInstanceEvent.GameFound, probableWaffleGameFoundEvent);
  }
}
