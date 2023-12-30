import { Injectable } from "@angular/core";
import { map } from "rxjs/operators";
import { Observable } from "rxjs";
import { IChatService } from "./chat.service.interface";
import { AuthenticatedSocketService } from "./authenticated-socket.service";
import { ChatMessage, GatewayChatEvent } from "@fuzzy-waddle/api-interfaces";

@Injectable({
  providedIn: "root"
})
export class ChatService implements IChatService {
  constructor(private authenticatedSocketService: AuthenticatedSocketService) {}

  sendMessage(msg: ChatMessage): void {
    const socket = this.authenticatedSocketService.socket;
    socket?.emit(GatewayChatEvent.CHAT_MESSAGE, msg);
  }

  get listenToMessages(): Observable<ChatMessage> | undefined {
    const socket = this.authenticatedSocketService.socket;
    return socket?.fromEvent<ChatMessage>(GatewayChatEvent.CHAT_MESSAGE).pipe(map((data: ChatMessage) => data));
  }
}
