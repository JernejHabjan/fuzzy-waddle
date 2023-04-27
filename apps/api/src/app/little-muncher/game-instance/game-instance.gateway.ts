import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'net';
import { UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../../../auth/guards/supabase-auth.guard';
import { CurrentUser } from '../../../auth/current-user';
import { AuthUser } from '@supabase/supabase-js';
import {
  GatewaySpectatorEvent,
  LittleMuncherCommunicatorKeyEvent,
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

  @UseGuards(SupabaseAuthGuard)
  @SubscribeMessage(LittleMuncherGatewayEvent.LittleMuncherMove)
  async broadcastMessage(
    @CurrentUser() user: AuthUser,
    @MessageBody() payload: LittleMuncherCommunicatorKeyEvent,
    @ConnectedSocket() client: Socket
  ) {
    (client as any).broadcast.emit(LittleMuncherGatewayEvent.LittleMuncherMove, payload); // todo just emit to all now
  }
}
