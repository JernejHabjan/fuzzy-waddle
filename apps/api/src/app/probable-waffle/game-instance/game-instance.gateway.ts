import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "net";
import {
  ProbableWaffleGameInstanceEvent,
  ProbableWaffleLevelStateChangeEvent,
  ProbableWaffleGatewayEvent,
  ProbableWafflePlayerEvent,
  ProbableWaffleRoomEvent,
  ProbableWaffleSpectatorEvent
} from "@fuzzy-waddle/api-interfaces";
import { GameInstanceGatewayInterface } from "./game-instance.gateway.interface";

export const GameInstanceGatewayStub = {
  emitRoom(roomEvent: ProbableWaffleRoomEvent) {
    //
  },
  emitLevelStateChange(levelStateChange: ProbableWaffleLevelStateChangeEvent) {
    //
  },
  emitSpectator(spectatorEvent: ProbableWaffleSpectatorEvent) {
    //
  },
  emitPlayer(playerEvent: ProbableWafflePlayerEvent) {
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

  emitLevelStateChange(levelStateChange: ProbableWaffleLevelStateChangeEvent) {
    this.server.emit(ProbableWaffleGameInstanceEvent.LevelStateChange, levelStateChange);
  }

  emitPlayer(playerEvent: ProbableWafflePlayerEvent) {
    this.server.emit(ProbableWaffleGameInstanceEvent.Player, playerEvent);
  }

  emitSpectator(spectatorEvent: ProbableWaffleSpectatorEvent) {
    this.server.emit(ProbableWaffleGameInstanceEvent.Spectator, spectatorEvent);
  }
}
