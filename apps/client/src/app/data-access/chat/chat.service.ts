import { Injectable, inject } from "@angular/core";
import { map } from "rxjs/operators";
import { Observable } from "rxjs";
import { IChatService } from "./chat.service.interface";
import { AuthenticatedSocketService } from "./authenticated-socket.service";
import { ChatMessage, GatewayChatEvent } from "@fuzzy-waddle/api-interfaces";

@Injectable({
  providedIn: "root"
})
export class ChatService implements IChatService {
  private authenticatedSocketService = inject(AuthenticatedSocketService);

  async sendMessage(msg: ChatMessage): Promise<void> {
    const socket = await this.authenticatedSocketService.getSocket();
    socket?.emit(GatewayChatEvent.CHAT_MESSAGE, msg);
  }

  async getMessageListener(): Promise<Observable<ChatMessage> | undefined> {
    const socket = await this.authenticatedSocketService.getSocket();
    return socket?.fromEvent<ChatMessage>(GatewayChatEvent.CHAT_MESSAGE).pipe(map((data: ChatMessage) => data));
  }
}
