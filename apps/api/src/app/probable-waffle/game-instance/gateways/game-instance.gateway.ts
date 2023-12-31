import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import {
  CommunicatorEvent,
  ProbableWaffleCommunicatorMessageEvent,
  ProbableWaffleCommunicatorType,
  ProbableWaffleGatewayEvent,
  ProbableWaffleGatewayRoomTypes,
  ProbableWaffleWebsocketRoomEvent
} from "@fuzzy-waddle/api-interfaces";
import { GameStateServerService } from "../game-state-server.service";
import { ProbableWaffleChatService } from "../chat/probable-waffle-chat.service";
import { UseGuards } from "@nestjs/common";
import { SupabaseAuthGuard } from "../../../../auth/guards/supabase-auth.guard";
import { CurrentUser } from "../../../../auth/current-user";
import { AuthUser } from "@supabase/supabase-js";

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",")
  }
})
export class GameInstanceGateway {
  @WebSocketServer() private readonly server: Server;

  constructor(
    private readonly gameStateServerService: GameStateServerService,
    private readonly probableWaffleChatService: ProbableWaffleChatService
  ) {}

  @UseGuards(SupabaseAuthGuard)
  @SubscribeMessage(ProbableWaffleGatewayEvent.ProbableWaffleAction)
  async broadcastProbableWaffleAction(
    @CurrentUser() user: AuthUser,
    @MessageBody() payload: CommunicatorEvent<any, ProbableWaffleCommunicatorType>,
    @ConnectedSocket() socket: Socket
  ) {
    console.log("broadcasting probable waffle action", payload.communicator);

    const success = this.gameStateServerService.updateGameState(payload, user);
    if (success) {
      this.server
        .to(`${ProbableWaffleGatewayRoomTypes.ProbableWaffleGameInstance}${payload.gameInstanceId}`)
        .emit(ProbableWaffleGatewayEvent.ProbableWaffleAction, payload);
    } else {
      // 400 error
    }
  }

  @UseGuards(SupabaseAuthGuard)
  @SubscribeMessage(ProbableWaffleGatewayEvent.ProbableWaffleMessage)
  async broadcastProbableWaffleMessage(
    @CurrentUser() user: AuthUser,
    @MessageBody() payload: CommunicatorEvent<any, ProbableWaffleCommunicatorType>,
    @ConnectedSocket() socket: Socket
  ) {
    console.log(`Probable Waffle - game instance message for ${payload.gameInstanceId}`);

    // clone the payload
    const newPayload = { ...payload };

    switch (newPayload.communicator) {
      case "message":
        const body = newPayload.data as ProbableWaffleCommunicatorMessageEvent;
        const sanitizedMessage = this.probableWaffleChatService.cleanMessage(body.chatMessage.text);
        body.chatMessage.text = sanitizedMessage;

        this.server
          .to(`${ProbableWaffleGatewayRoomTypes.ProbableWaffleGameInstance}${payload.gameInstanceId}`)
          .emit(ProbableWaffleGatewayEvent.ProbableWaffleMessage, newPayload);
        break;
      default:
        throw new Error("Probable Waffle - Message broadcast - unknown communicator");
    }
  }

  @UseGuards(SupabaseAuthGuard)
  @SubscribeMessage(ProbableWaffleGatewayEvent.ProbableWaffleWebsocketRoom)
  async broadcastProbableWaffleWebsocketRoom(
    @CurrentUser() user: AuthUser,
    @MessageBody() payload: ProbableWaffleWebsocketRoomEvent,
    @ConnectedSocket() socket: Socket
  ) {
    switch (payload.type) {
      case "join":
        socket.join(`${ProbableWaffleGatewayRoomTypes.ProbableWaffleGameInstance}${payload.gameInstanceId}`);
        console.log(
          user.id,
          "joined room",
          `${ProbableWaffleGatewayRoomTypes.ProbableWaffleGameInstance}${payload.gameInstanceId}`
        );
        break;
      case "leave":
        socket.leave(`${ProbableWaffleGatewayRoomTypes.ProbableWaffleGameInstance}${payload.gameInstanceId}`);
        console.log(
          user.id,
          "left room",
          `${ProbableWaffleGatewayRoomTypes.ProbableWaffleGameInstance}${payload.gameInstanceId}`
        );
        break;
      default:
        throw new Error("Probable Waffle - Web socket room broadcast - unknown communicator");
    }
  }
}
