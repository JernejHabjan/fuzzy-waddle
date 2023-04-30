import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { CurrentUser } from '../../auth/current-user';
import { AuthUser } from '@supabase/supabase-js';
import { UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../../auth/guards/supabase-auth.guard';
import { ChatService } from '../chat/chat.service';
import { Server } from 'net';
import { ChatMessage, GatewayChatEvent } from '@fuzzy-waddle/api-interfaces';
import { MyConnectedSocket } from '../little-muncher/game-instance/game-state.gateway';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN
  }
})
export class EventsGateway {
  @WebSocketServer()
  private server: Server;

  constructor(private readonly chatService: ChatService) {}

  // @SubscribeMessage(GatewayEvent.CHAT_MESSAGE)
  // findAll(@MessageBody() data: ChatMessage): Observable<WsResponse<ChatMessage>> {
  //   return from([data]).pipe(map(item => ({ event: GatewayEvent.CHAT_MESSAGE, data: item })));
  // }

  //subscribe to chat message and broadcast to all clients
  @UseGuards(SupabaseAuthGuard)
  @SubscribeMessage(GatewayChatEvent.CHAT_MESSAGE)
  async broadcastMessage(
    @CurrentUser() user: AuthUser,
    @MessageBody() payload: ChatMessage,
    @ConnectedSocket() client: MyConnectedSocket
  ) {
    // clone the payload
    const newPayload = { ...payload };

    // post to supabase
    const sanitizedMessage = await this.chatService.postMessage(newPayload.text, user); // todo for demo
    newPayload.text = sanitizedMessage;

    // emit the message to all connected clients
    this.server.emit(GatewayChatEvent.CHAT_MESSAGE, newPayload);
  }

  // @SubscribeMessage(GatewayEvent.CHAT_MESSAGE)
  // findAll(@MessageBody() data: any): Observable<WsResponse<number>> {
  //   return from([1, 2, 3]).pipe(map(item => ({ event: GatewayEvent.CHAT_MESSAGE, data: item })));
  // }
}
