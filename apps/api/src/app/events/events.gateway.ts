import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as BadWords from 'bad-words-plus';
import { ChatMessage, GatewayEvent } from '@fuzzy-waddle/api-interfaces';
import { IBadWords } from '../../interfaces/bad-words.interface';
import { ChatService } from '../chat/chat.service';
import { CurrentUser } from '../../auth/current-user';
import { AuthUser } from '@supabase/supabase-js';
import { UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../../auth/guards/supabase-auth.guard';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN
  }
})
export class EventsGateway {
  @WebSocketServer()
  server: Server;
  /**
   * https://www.npmjs.com/package/bad-words?activeTab=versions
   */
  private badWordsFilter: IBadWords;

  constructor(private readonly chatService: ChatService) {
    this.badWordsFilter = new BadWords({ list: ['tristo', 'kosmatih', 'medvedov'] }) as IBadWords;
  }

  // @SubscribeMessage(GatewayEvent.CHAT_MESSAGE)
  // findAll(@MessageBody() data: ChatMessage): Observable<WsResponse<ChatMessage>> {
  //   return from([data]).pipe(map(item => ({ event: GatewayEvent.CHAT_MESSAGE, data: item })));
  // }

  //subscribe to chat message and broadcast to all clients
  @UseGuards(SupabaseAuthGuard)
  @SubscribeMessage(GatewayEvent.CHAT_MESSAGE)
  async broadcastMessage(
    @CurrentUser() user: AuthUser,
    @MessageBody() payload: ChatMessage,
    @ConnectedSocket() client: Socket
  ) {
    // clone the payload
    const newPayload = { ...payload };
    // filter out bad words

    newPayload.text = EventsGateway.cleanBadWords(payload.text, this.badWordsFilter);

    // post to supabase
    await this.chatService.postMessage(newPayload.text, user); // todo for demo

    // emit the message to all connected clients
    this.server.emit(GatewayEvent.CHAT_MESSAGE, newPayload);
  }

  /**
   * https://github.com/web-mech/badwords/issues/93
   * todo move this to some other file
   */
  public static cleanBadWords(text: string, badWordsFilter: IBadWords): string {
    const additionalSuffix = 'ABC';
    const wholeText = text + additionalSuffix;
    const clean = badWordsFilter.clean(wholeText);
    return clean.substring(0, clean.length - additionalSuffix.length);
  }

  // @SubscribeMessage(GatewayEvent.CHAT_MESSAGE)
  // findAll(@MessageBody() data: any): Observable<WsResponse<number>> {
  //   return from([1, 2, 3]).pipe(map(item => ({ event: GatewayEvent.CHAT_MESSAGE, data: item })));
  // }
}
