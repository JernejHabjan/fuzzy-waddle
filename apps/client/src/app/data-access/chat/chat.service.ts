import { inject, Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { map } from "rxjs/operators";
import { firstValueFrom, Observable } from "rxjs";
import { type IChatService } from "./chat.service.interface";
import { AuthenticatedSocketService } from "./authenticated-socket.service";
import { type ChatMessage, GatewayChatEvent, type GetMessagesResponseDto } from "@fuzzy-waddle/api-interfaces";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: "root"
})
export class ChatService implements IChatService {
  private readonly authenticatedSocketService = inject(AuthenticatedSocketService);
  private readonly httpClient = inject(HttpClient);

  async sendMessage(msg: ChatMessage): Promise<void> {
    const socket = await this.authenticatedSocketService.getSocket();
    socket?.emit(GatewayChatEvent.CHAT_MESSAGE, msg);
  }

  async getMessageListener(): Promise<Observable<ChatMessage> | undefined> {
    const socket = await this.authenticatedSocketService.getSocket();
    return socket?.fromEvent<ChatMessage, any>(GatewayChatEvent.CHAT_MESSAGE).pipe(map((data: ChatMessage) => data));
  }

  async getMessages(limit = 10, offset = 0, gameInstanceId?: string): Promise<GetMessagesResponseDto> {
    const url = environment.api + "api/chat/messages";
    let params = new HttpParams().set("limit", limit.toString()).set("offset", offset.toString());
    if (gameInstanceId) {
      params = params.set("gameInstanceId", gameInstanceId);
    }
    return await firstValueFrom(this.httpClient.get<GetMessagesResponseDto>(url, { params }));
  }
}
