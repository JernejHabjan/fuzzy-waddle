import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'net';
import {
  GatewayEvent,
  LittleMuncherSceneCommunicatorKeyEvent,
  RoomEvent,
  SpectatorEvent
} from '@fuzzy-waddle/api-interfaces';
import { UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../../../auth/guards/supabase-auth.guard';
import { CurrentUser } from '../../../auth/current-user';
import { AuthUser } from '@supabase/supabase-js';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN
  }
})
export class GameInstanceGateway {
  @WebSocketServer()
  private server: Server;

  emitRoom(roomEvent: RoomEvent) {
    this.server.emit(GatewayEvent.LittleMuncherRoom, roomEvent);
  }

  emitSpectator(spectatorEvent: SpectatorEvent) {
    this.server.emit(GatewayEvent.LittleMuncherSpectator, spectatorEvent);
  }

  @UseGuards(SupabaseAuthGuard)
  @SubscribeMessage(GatewayEvent.LittleMuncherMove)
  async broadcastMessage(
    @CurrentUser() user: AuthUser,
    @MessageBody() payload: LittleMuncherSceneCommunicatorKeyEvent,
    @ConnectedSocket() client: Socket
  ) {
    (client as any).broadcast.emit(GatewayEvent.LittleMuncherMove, payload); // todo just emit to all now
  }
}
