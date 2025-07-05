import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import {
  CommunicatorEvent,
  ProbableWaffleCommunicatorMessageEvent,
  ProbableWaffleCommunicatorType,
  ProbableWaffleGameFoundEvent,
  ProbableWaffleGameInstanceEvent,
  ProbableWaffleGatewayEvent,
  ProbableWaffleGatewayRoomTypes,
  ProbableWaffleWebsocketRoomEvent
} from "@fuzzy-waddle/api-interfaces";
import { ProbableWaffleChatService } from "../chat/probable-waffle-chat.service";
import { UseGuards } from "@nestjs/common";
import { AuthUser } from "@supabase/supabase-js";
import { SupabaseAuthGuard } from "../../../auth/guards/supabase-auth.guard";
import { CurrentUser } from "../../../auth/current-user";
import { GameStateServerService } from "./game-state-server.service";
import { RoomServerService } from "../game-room/room-server.service";

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",")
  }
})
export class GameInstanceGateway {
  @WebSocketServer() private readonly server: Server;

  constructor(
    private readonly gameStateServerService: GameStateServerService,
    private readonly probableWaffleChatService: ProbableWaffleChatService,
    private readonly roomServerService: RoomServerService
  ) {}

  emitGameFound(probableWaffleGameFoundEvent: ProbableWaffleGameFoundEvent) {
    this.server.emit(ProbableWaffleGameInstanceEvent.GameFound, probableWaffleGameFoundEvent);
  }

  @UseGuards(SupabaseAuthGuard)
  @SubscribeMessage(ProbableWaffleGatewayEvent.ProbableWaffleAction)
  async broadcastProbableWaffleAction(
    @CurrentUser() user: AuthUser,
    @MessageBody() body: CommunicatorEvent<any, ProbableWaffleCommunicatorType>,
    @ConnectedSocket() socket: Socket
  ) {
    console.log("Ashes of the Ancients - GI action:", body.communicator, body.payload);

    const success = this.gameStateServerService.updateGameState(body, user);
    if (success) {
      // https://socket.io/docs/v3/emit-cheatsheet/
      socket
        .to(`${ProbableWaffleGatewayRoomTypes.ProbableWaffleGameInstance}${body.gameInstanceId}`)
        .emit(ProbableWaffleGatewayEvent.ProbableWaffleAction, body);

      this.roomServerService.emitCertainGameInstanceEventsToAllUsers(body, user);
    } else {
      // 400 error
    }
  }

  @UseGuards(SupabaseAuthGuard)
  @SubscribeMessage(ProbableWaffleGatewayEvent.ProbableWaffleMessage)
  async broadcastProbableWaffleMessage(
    @CurrentUser() user: AuthUser,
    @MessageBody() body: CommunicatorEvent<any, ProbableWaffleCommunicatorType>,
    @ConnectedSocket() socket: Socket
  ) {
    console.log(`Ashes of the Ancients - GI chat message ${body.gameInstanceId}`);

    // clone the payload
    const newPayload = { ...body };

    switch (newPayload.communicator) {
      case "message":
        const body = newPayload.payload as ProbableWaffleCommunicatorMessageEvent;
        const sanitizedMessage = this.probableWaffleChatService.cleanMessage(body.chatMessage.text);
        body.chatMessage.text = sanitizedMessage;

        // https://socket.io/docs/v3/emit-cheatsheet/
        socket
          .to(`${ProbableWaffleGatewayRoomTypes.ProbableWaffleGameInstance}${body.gameInstanceId}`)
          .emit(ProbableWaffleGatewayEvent.ProbableWaffleMessage, newPayload);
        break;
      default:
        throw new Error("Ashes of the Ancients - Message broadcast - unknown communicator");
    }
  }

  @UseGuards(SupabaseAuthGuard)
  @SubscribeMessage(ProbableWaffleGatewayEvent.ProbableWaffleWebsocketRoom)
  async broadcastProbableWaffleWebsocketRoom(
    @CurrentUser() user: AuthUser,
    @MessageBody() body: ProbableWaffleWebsocketRoomEvent,
    @ConnectedSocket() socket: Socket
  ) {
    switch (body.type) {
      case "join":
        socket.join(`${ProbableWaffleGatewayRoomTypes.ProbableWaffleGameInstance}${body.gameInstanceId}`);
        console.log(
          user.id,
          "joined room",
          `${ProbableWaffleGatewayRoomTypes.ProbableWaffleGameInstance}${body.gameInstanceId}`
        );
        break;
      case "leave":
        socket.leave(`${ProbableWaffleGatewayRoomTypes.ProbableWaffleGameInstance}${body.gameInstanceId}`);
        console.log(
          user.id,
          "left room",
          `${ProbableWaffleGatewayRoomTypes.ProbableWaffleGameInstance}${body.gameInstanceId}`
        );
        break;
      default:
        throw new Error("Ashes of the Ancients - Web socket room broadcast - unknown communicator");
    }
  }
}
