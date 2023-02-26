import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { map } from 'rxjs/operators';
import { ChatMessage, GatewayEvent } from '@fuzzy-waddle/api-interfaces';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  constructor(private socket: Socket, private authService: AuthService) {}

  sendMessage(msg: ChatMessage): void {
    this.socket.emit(GatewayEvent.CHAT_MESSAGE, msg);
  }
  getMessage(): Observable<ChatMessage> {
    return this.socket.fromEvent<ChatMessage>(GatewayEvent.CHAT_MESSAGE).pipe(map((data: ChatMessage) => data));
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
