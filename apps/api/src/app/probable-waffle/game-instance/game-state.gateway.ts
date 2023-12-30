import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { UseGuards } from "@nestjs/common";
import { SupabaseAuthGuard } from "../../../auth/guards/supabase-auth.guard";
import { CurrentUser } from "../../../auth/current-user";
import { AuthUser } from "@supabase/supabase-js";
import {
  CommunicatorEvent,
  GatewayChatEvent,
  ProbableWaffleCommunicatorMessageEvent,
  ProbableWaffleCommunicatorType,
  ProbableWaffleGatewayEvent,
  ProbableWaffleGatewayRoomTypes,
  ProbableWaffleWebsocketRoomEvent
} from "@fuzzy-waddle/api-interfaces";
import { GameStateServerService } from "./game-state-server.service";
import { ProbableWaffleChatService } from "./chat/probable-waffle-chat.service";
import { Server, Socket } from "socket.io";

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",")
  }
})
export class GameStateGateway {
  @WebSocketServer()
  private server: Server;

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
    console.log("broadcasting probable waffle message");

    // clone the payload
    const newPayload = { ...payload };

    switch (newPayload.communicator) {
      case "message":
        const body = newPayload.data as ProbableWaffleCommunicatorMessageEvent;
        const sanitizedMessage = this.probableWaffleChatService.cleanMessage(body.message);
        body.message = sanitizedMessage;
        this.server
          .to(`${ProbableWaffleGatewayRoomTypes.ProbableWaffleGameInstance}${payload.gameInstanceId}`)
          .emit(ProbableWaffleGatewayEvent.ProbableWaffleMessage, body);
        break;
      default:
        throw new Error("Unknown communicator");
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
          "joined room",
          `${ProbableWaffleGatewayRoomTypes.ProbableWaffleGameInstance}${payload.gameInstanceId}`
        );
        break;
      case "leave":
        socket.leave(`${ProbableWaffleGatewayRoomTypes.ProbableWaffleGameInstance}${payload.gameInstanceId}`);
        console.log(
          "left room",
          `${ProbableWaffleGatewayRoomTypes.ProbableWaffleGameInstance}${payload.gameInstanceId}`
        );
        break;
      default:
        throw new Error("Unknown communicator");
    }
  }
}
