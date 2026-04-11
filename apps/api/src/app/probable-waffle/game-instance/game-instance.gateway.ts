import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
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
  type ProbableWafflePlayerDisconnectedEvent,
  type ProbableWafflePlayerReconnectedEvent,
  type ProbableWaffleWebsocketRoomEvent
} from "@fuzzy-waddle/api-interfaces";
import { ProbableWaffleChatService } from "../chat/probable-waffle-chat.service";
import { UseGuards } from "@nestjs/common";
import { type AuthUser } from "@supabase/supabase-js";
import { SupabaseAuthGuard } from "../../../auth/guards/supabase-auth.guard";
import { CurrentUser } from "../../../auth/current-user";
import { GameStateServerService } from "./game-state-server.service";
import { RoomServerService } from "../game-room/room-server.service";
import { ChatService } from "../../chat/chat.service";
import { PlayerDisconnectTrackerService } from "./player-disconnect-tracker.service";
import { GameInstanceService } from "./game-instance.service";

const RECONNECT_WINDOW_SECONDS = 60;

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",")
  }
})
export class GameInstanceGateway implements OnGatewayDisconnect {
  @WebSocketServer() private readonly server!: Server;

  constructor(
    private readonly gameStateServerService: GameStateServerService,
    private readonly probableWaffleChatService: ProbableWaffleChatService,
    private readonly roomServerService: RoomServerService,
    private readonly chatService: ChatService,
    private readonly disconnectTracker: PlayerDisconnectTrackerService,
    private readonly gameInstanceService: GameInstanceService
  ) {}

  emitGameFound(probableWaffleGameFoundEvent: ProbableWaffleGameFoundEvent) {
    this.server.emit(ProbableWaffleGameInstanceEvent.GameFound, probableWaffleGameFoundEvent);
  }

  handleDisconnect(socket: Socket): void {
    // No auth context here — use the tracker to map socketId → player
    const playerInfo = this.disconnectTracker.handleDisconnect(socket.id, (userId, gameInstanceId) => {
      // Grace window expired — player did not reconnect in time.
      // Find the player's number and broadcast eviction.
      const gameInstance = this.gameInstanceService.findGameInstance(gameInstanceId);
      if (!gameInstance) return;
      const player = gameInstance.players.find((p) => p.playerController.data.userId === userId);
      if (!player) return;
      const playerNumber = player.playerNumber;
      if (playerNumber === undefined) return;
      // Broadcast eviction to remaining players so they can pause/continue.
      const roomId = `${ProbableWaffleGatewayRoomTypes.ProbableWaffleGameInstance}${gameInstanceId}`;
      this.server.to(roomId).emit(ProbableWaffleGatewayEvent.ProbableWaffleAction, {
        gameInstanceId,
        communicator: "player-disconnected",
        payload: {
          gameInstanceId,
          emitterUserId: null,
          playerNumber,
          reconnectWindowSeconds: 0 // 0 = grace window expired
        } satisfies ProbableWafflePlayerDisconnectedEvent
      });
    });

    if (playerInfo) {
      // Immediately notify remaining players that this player's connection dropped
      const gameInstance = this.gameInstanceService.findGameInstance(playerInfo.gameInstanceId);
      if (!gameInstance) return;
      const player = gameInstance.players.find((p) => p.playerController.data.userId === playerInfo.userId);
      if (!player) return;
      const playerNumber = player.playerNumber;
      if (playerNumber === undefined) return;
      const roomId = `${ProbableWaffleGatewayRoomTypes.ProbableWaffleGameInstance}${playerInfo.gameInstanceId}`;
      this.server.to(roomId).emit(ProbableWaffleGatewayEvent.ProbableWaffleAction, {
        gameInstanceId: playerInfo.gameInstanceId,
        communicator: "player-disconnected",
        payload: {
          gameInstanceId: playerInfo.gameInstanceId,
          emitterUserId: null,
          playerNumber,
          reconnectWindowSeconds: RECONNECT_WINDOW_SECONDS
        } satisfies ProbableWafflePlayerDisconnectedEvent
      });
    }
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
        // Track socket ↔ player so we can handle disconnect gracefully.
        this.disconnectTracker.registerSocket(socket.id, user.id, body.gameInstanceId!);
        console.log(
          user.id,
          "joined room",
          `${ProbableWaffleGatewayRoomTypes.ProbableWaffleGameInstance}${body.gameInstanceId}`
        );
        // If this player was previously disconnected, notify peers that they're back.
        {
          const gameInstance = this.gameInstanceService.findGameInstance(body.gameInstanceId!);
          const player = gameInstance?.players.find((p) => p.playerController.data.userId === user.id);
          if (player?.playerNumber !== undefined) {
            const roomId = `${ProbableWaffleGatewayRoomTypes.ProbableWaffleGameInstance}${body.gameInstanceId}`;
            // Notify other clients (not the rejoining socket itself)
            socket.to(roomId).emit(ProbableWaffleGatewayEvent.ProbableWaffleAction, {
              gameInstanceId: body.gameInstanceId,
              communicator: "player-reconnected",
              payload: {
                gameInstanceId: body.gameInstanceId,
                emitterUserId: null,
                playerNumber: player.playerNumber
              } satisfies ProbableWafflePlayerReconnectedEvent
            });
          }
        }
        break;
      case "leave":
        // Explicit leave — cancel any grace-period timer.
        this.disconnectTracker.markExplicitQuit(socket.id);
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
