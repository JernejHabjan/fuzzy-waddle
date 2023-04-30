import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'net';
import {
  GatewaySpectatorEvent,
  LittleMuncherGatewayEvent,
  RoomEvent,
  SpectatorEvent
} from '@fuzzy-waddle/api-interfaces';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN
  }
})
export class GameInstanceGateway {
  @WebSocketServer()
  private server: Server;

  emitRoom(roomEvent: RoomEvent) {
    this.server.emit(LittleMuncherGatewayEvent.LittleMuncherRoom, roomEvent);
  }

  emitSpectator(spectatorEvent: SpectatorEvent) {
    this.server.emit(GatewaySpectatorEvent.Spectator, spectatorEvent);
  }
}
