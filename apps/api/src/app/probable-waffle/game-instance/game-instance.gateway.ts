import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import {
  type CommunicatorEvent,
  type ProbableWaffleCommunicatorMessageEvent,
  type ProbableWaffleCommunicatorType,
  type ProbableWaffleGameFoundEvent,
  ProbableWaffleGameInstanceEvent,
  ProbableWaffleGatewayEvent,
  ProbableWaffleGatewayRoomTypes,
  type ProbableWaffleWebsocketRoomEvent
} from "@fuzzy-waddle/api-interfaces";
import { ProbableWaffleChatService } from "../chat/probable-waffle-chat.service";
import { UseGuards } from "@nestjs/common";
import { type AuthUser } from "@supabase/supabase-js";
import { OnlineAccessGuard } from "../../../auth/guards/online-access.guard";
import { CurrentUser } from "../../../auth/current-user";
import { GameStateServerService } from "./game-state-server.service";
import { RoomServerService } from "../game-room/room-server.service";
import { ChatService } from "../../chat/chat.service";
import { SocketConnectionAuthService } from "../../../auth/socket-connection-auth.service";

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",")
  }
})
export class GameInstanceGateway implements OnGatewayConnection {
  @WebSocketServer() private readonly server!: Server;

  constructor(
    private readonly gameStateServerService: GameStateServerService,
    private readonly probableWaffleChatService: ProbableWaffleChatService,
    private readonly roomServerService: RoomServerService,
    private readonly chatService: ChatService,
    private readonly socketConnectionAuthService: SocketConnectionAuthService
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    await this.socketConnectionAuthService.disconnectUnauthenticatedClient(client);
  }

  emitGameFound(probableWaffleGameFoundEvent: ProbableWaffleGameFoundEvent) {
    this.server.emit(ProbableWaffleGameInstanceEvent.GameFound, probableWaffleGameFoundEvent);
  }

  @UseGuards(OnlineAccessGuard)
  @SubscribeMessage(ProbableWaffleGatewayEvent.ProbableWaffleAction)
  async broadcastProbableWaffleAction(
    @CurrentUser() user: AuthUser,
    @MessageBody() body: CommunicatorEvent<any, ProbableWaffleCommunicatorType>,
    @ConnectedSocket() socket: Socket
  ) {
    console.log("Ashes of the Ancients - GI action:", body.communicator, body.payload);
    this.gameStateServerService.ensureAuthorizedMutation(body, user);

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

  @UseGuards(OnlineAccessGuard)
  @SubscribeMessage(ProbableWaffleGatewayEvent.ProbableWaffleMessage)
  async broadcastProbableWaffleMessage(
    @CurrentUser() user: AuthUser,
    @MessageBody() body: CommunicatorEvent<any, ProbableWaffleCommunicatorType>,
    @ConnectedSocket() socket: Socket
  ) {
    console.log(`Ashes of the Ancients - GI chat message ${body.gameInstanceId}`);
    this.gameStateServerService.ensureCanAccessGameRoom(body.gameInstanceId!, user);

    // clone the payload
    const newPayload = { ...body };

    switch (newPayload.communicator) {
      case "message":
        const messagePayload = newPayload.payload as ProbableWaffleCommunicatorMessageEvent;
        const sanitizedMessage = this.probableWaffleChatService.cleanMessage(messagePayload.chatMessage.text);
        messagePayload.chatMessage.text = sanitizedMessage;

        // Persist the message to the database
        try {
          await this.chatService.postMessage(sanitizedMessage, user, messagePayload.gameInstanceId);
        } catch (error) {
          console.error("Failed to persist lobby message:", error);
        }

        // https://socket.io/docs/v3/emit-cheatsheet/
        socket
          .to(`${ProbableWaffleGatewayRoomTypes.ProbableWaffleGameInstance}${messagePayload.gameInstanceId}`)
          .emit(ProbableWaffleGatewayEvent.ProbableWaffleMessage, newPayload);
        break;
      default:
        throw new Error("Ashes of the Ancients - Message broadcast - unknown communicator");
    }
  }

  @UseGuards(OnlineAccessGuard)
  @SubscribeMessage(ProbableWaffleGatewayEvent.ProbableWaffleWebsocketRoom)
  async broadcastProbableWaffleWebsocketRoom(
    @CurrentUser() user: AuthUser,
    @MessageBody() body: ProbableWaffleWebsocketRoomEvent,
    @ConnectedSocket() socket: Socket
  ) {
    this.gameStateServerService.ensureCanAccessGameRoom(body.gameInstanceId, user);

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
