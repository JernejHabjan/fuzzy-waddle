import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'net';
import { UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../../../auth/guards/supabase-auth.guard';
import { CurrentUser } from '../../../auth/current-user';
import { AuthUser } from '@supabase/supabase-js';
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

  @UseGuards(SupabaseAuthGuard)
  @SubscribeMessage(LittleMuncherGatewayEvent.LittleMuncherAction)
  async broadcastMove(@CurrentUser() user: AuthUser, @MessageBody() payload: any, @ConnectedSocket() client: Socket) {
    (client as any).broadcast.emit(LittleMuncherGatewayEvent.LittleMuncherAction, payload);
  }
}
