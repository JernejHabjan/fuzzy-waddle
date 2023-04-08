import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'net';
import { GatewayEvent, SpectatorRoom } from '@fuzzy-waddle/api-interfaces';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN
  }
})
export class GameInstanceGateway {
  @WebSocketServer()
  private server: Server;

  emit(spectatorRoom: SpectatorRoom) {
    this.server.emit(GatewayEvent.LittleMuncherSpectateRoom, spectatorRoom);
  }
}
