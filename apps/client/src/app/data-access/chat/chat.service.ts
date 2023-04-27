import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { IChatService } from './chat.service.interface';
import { AuthenticatedSocketService } from './authenticated-socket.service';
import { Socket } from 'ngx-socket-io';
import { AuthService } from '../../auth/auth.service';
import { ChatMessage, GatewayChatEvent } from '@fuzzy-waddle/api-interfaces';

@Injectable({
  providedIn: 'root'
})
export class ChatService implements IChatService {
  private authenticatedSocket: Socket;

  constructor(private authenticatedSocketService: AuthenticatedSocketService, private authService: AuthService) {
    this.authenticatedSocket = this.authenticatedSocketService.createAuthSocket(); // todo this needs to be constructed only when the user is authenticated
  }

  sendMessage(msg: ChatMessage): void {
    this.authenticatedSocket.emit(GatewayChatEvent.CHAT_MESSAGE, msg);
  }

  getMessage(): Observable<ChatMessage> {
    return this.authenticatedSocket
      .fromEvent<ChatMessage>(GatewayChatEvent.CHAT_MESSAGE)
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
