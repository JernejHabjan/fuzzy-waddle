import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { map } from 'rxjs/operators';
import { ChatMessage, GatewayEvent } from '@fuzzy-waddle/api-interfaces';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { ChatServiceInterface } from './chat.service.interface';
import { AuthenticatedSocket } from './socket.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService implements ChatServiceInterface {
  private authenticatedSocket: AuthenticatedSocket;

  constructor(private socket: Socket, private authService: AuthService) {
    this.authenticatedSocket = new AuthenticatedSocket(this.authService); // todo this needs to be constructed only when the user is authenticated
  }

  sendMessage(msg: ChatMessage): void {
    this.authenticatedSocket.emit(GatewayEvent.CHAT_MESSAGE, msg);
  }

  getMessage(): Observable<ChatMessage> {
    return this.authenticatedSocket
      .fromEvent<ChatMessage>(GatewayEvent.CHAT_MESSAGE)
      .pipe(map((data: ChatMessage) => data));
  }

  createMessage(message: string): ChatMessage {
    return {
      text: message,
      userId: this.authService.userId as string,
      fullName: this.authService.fullName as string,
      createdAt: new Date()
    };
  }
}
