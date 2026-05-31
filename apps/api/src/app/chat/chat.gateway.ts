import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { CurrentUser } from "../../auth/current-user";
import { type AuthUser } from "@supabase/supabase-js";
import { UseGuards } from "@nestjs/common";
import { OnlineAccessGuard } from "../../auth/guards/online-access.guard";
import { ChatService } from "./chat.service";
import { type ChatMessage, GatewayChatEvent } from "@fuzzy-waddle/api-interfaces";
import { Server } from "socket.io";

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",")
  }
})
export class ChatGateway {
  @WebSocketServer() private readonly server!: Server;

  constructor(private readonly chatService: ChatService) {}
  //subscribe to chat message and broadcast to all clients
  @UseGuards(OnlineAccessGuard)
  @SubscribeMessage(GatewayChatEvent.CHAT_MESSAGE)
  async broadcastMessage(@CurrentUser() user: AuthUser, @MessageBody() payload: ChatMessage) {
    const persistedMessage = await this.chatService.postMessage(
      payload.text,
      user,
      payload.gameInstanceId ?? undefined
    );

    // emit the message to all connected clients
    this.server.emit(GatewayChatEvent.CHAT_MESSAGE, persistedMessage);
  }
}
