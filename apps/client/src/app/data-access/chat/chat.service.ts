import { inject, Injectable } from "@angular/core";
import { map } from "rxjs/operators";
import { Observable, firstValueFrom } from "rxjs";
import { type IChatService } from "./chat.service.interface";
import { AuthenticatedSocketService } from "./authenticated-socket.service";
import { type ChatMessage, GatewayChatEvent } from "@fuzzy-waddle/api-interfaces";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: "root"
})
export class ChatService implements IChatService {
  private authenticatedSocketService = inject(AuthenticatedSocketService);
  private httpClient = inject(HttpClient);

  async sendMessage(msg: ChatMessage): Promise<void> {
    const socket = await this.authenticatedSocketService.getSocket();
    socket?.emit(GatewayChatEvent.CHAT_MESSAGE, msg);
  }

  async getMessageListener(): Promise<Observable<ChatMessage> | undefined> {
    const socket = await this.authenticatedSocketService.getSocket();
    return socket?.fromEvent<ChatMessage, any>(GatewayChatEvent.CHAT_MESSAGE).pipe(map((data: ChatMessage) => data));
  }

  async getMessages(limit?: number): Promise<ChatMessage[]> {
    const url = `${environment.api}messages${limit ? `?limit=${limit}` : ""}`;
    return firstValueFrom(this.httpClient.get<ChatMessage[]>(url));
  }
}
