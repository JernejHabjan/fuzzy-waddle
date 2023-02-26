import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import * as BadWords from 'bad-words';
import { ChatMessage, GatewayEvent } from '@fuzzy-waddle/api-interfaces';
import { IBadWords } from '../../interfaces/bad-words.interface';

@WebSocketGateway({
  cors: {
    origin: '*'
  }
})
export class EventsGateway {
  @WebSocketServer()
  server: Server;
  /**
   * https://www.npmjs.com/package/bad-words?activeTab=versions
   */
  private badWordsFilter: IBadWords;

  constructor() {
    this.badWordsFilter = new BadWords({ list: ['tristo', 'kosmatih', 'medvedov'] }) as IBadWords;
  }

  // @SubscribeMessage(GatewayEvent.CHAT_MESSAGE)
  // findAll(@MessageBody() data: ChatMessage): Observable<WsResponse<ChatMessage>> {
  //   return from([data]).pipe(map(item => ({ event: GatewayEvent.CHAT_MESSAGE, data: item })));
  // }

  //subscribe to chat message and broadcast to all clients
  @SubscribeMessage(GatewayEvent.CHAT_MESSAGE)
  broadcastMessage(client: any, payload: ChatMessage) {
    // filter out bad words
    payload.text = this.badWordsFilter.clean(payload.text);

    this.server.emit(GatewayEvent.CHAT_MESSAGE, payload);
  }

  // @SubscribeMessage(GatewayEvent.CHAT_MESSAGE)
  // findAll(@MessageBody() data: any): Observable<WsResponse<number>> {
  //   return from([1, 2, 3]).pipe(map(item => ({ event: GatewayEvent.CHAT_MESSAGE, data: item })));
  // }
}
