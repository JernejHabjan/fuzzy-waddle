import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ChatMessage, GatewayEvent } from '@fuzzy-waddle/api-interfaces';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  // @SubscribeMessage(GatewayEvent.CHAT_MESSAGE)
  // findAll(@MessageBody() data: ChatMessage): Observable<WsResponse<ChatMessage>> {
  //   return from([data]).pipe(map(item => ({ event: GatewayEvent.CHAT_MESSAGE, data: item })));
  // }

  //subscribe to chat message and broadcast to all clients
  @SubscribeMessage(GatewayEvent.CHAT_MESSAGE)
  broadcastMessage(client: any, payload: ChatMessage) {
    this.server.emit(GatewayEvent.CHAT_MESSAGE, payload);
  }

  // @SubscribeMessage(GatewayEvent.CHAT_MESSAGE)
  // findAll(@MessageBody() data: any): Observable<WsResponse<number>> {
  //   return from([1, 2, 3]).pipe(map(item => ({ event: GatewayEvent.CHAT_MESSAGE, data: item })));
  // }
}
