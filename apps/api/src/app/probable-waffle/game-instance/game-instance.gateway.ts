import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import {
  type CommunicatorEvent,
  GameSessionState,
  type ProbableWaffleCommunicatorMessageEvent,
  type ProbableWaffleCommunicatorType,
  type ProbableWaffleGameCommandEvent,
  type ProbableWaffleGameFoundEvent,
  type ProbableWaffleHostMigratedEvent,
  type ProbableWaffleGameInstanceMetadataChangeEvent,
  ProbableWaffleGameInstanceEvent,
  ProbableWaffleGatewayEvent,
  ProbableWaffleGatewayRoomTypes,
  type ProbableWafflePlayerDataChangeEvent,
  type ProbableWafflePlayerDisconnectedEvent,
  ProbableWafflePlayerType,
  type ProbableWafflePlayerReconnectedEvent,
  type ProbableWaffleSpectatorDataChangeEvent,
  type ProbableWaffleWebsocketRoomEvent
} from "@fuzzy-waddle/api-interfaces";
import { ProbableWaffleChatService } from "../chat/probable-waffle-chat.service";
import { UseGuards } from "@nestjs/common";
import { type AuthUser } from "@supabase/supabase-js";
import { SupabaseAuthGuard } from "../../../auth/guards/supabase-auth.guard";
import { CurrentUser } from "../../../auth/current-user";
import { GameStateServerService, type UpdateGameStateResult } from "./game-state-server.service";
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
export class GameInstanceGateway implements OnGatewayConnection, OnGatewayDisconnect {
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

  handleConnection(socket: Socket): void {
    console.log(`[Gateway] socket connect socketId=${socket.id} transport=${socket.conn.transport.name}`);
    socket.on("disconnect", (reason) => {
      console.log(`[Gateway] socket disconnect reason socketId=${socket.id} reason=${reason}`);
    });
  }

  handleDisconnect(socket: Socket): void {
    console.log(`[Gateway] socket disconnect socketId=${socket.id}`);
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

      const currentHostUserId = gameInstance.gameInstanceMetadata.data.currentHostUserId ?? gameInstance.gameInstanceMetadata.data.createdBy;
      if (currentHostUserId === playerInfo.userId) {
        this.emitHostMigration(playerInfo.gameInstanceId, playerInfo.userId);
      }
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

    const removedPlayerUserId = this.getRemovedPlayerUserId(body);
    const participantLeft = this.isParticipantLeaving(body);
    const result: UpdateGameStateResult = this.gameStateServerService.updateGameState(body, user);
    const roomId = `${ProbableWaffleGatewayRoomTypes.ProbableWaffleGameInstance}${body.gameInstanceId}`;
    if (result.success) {
      if (body.communicator === "game-command") {
        // Include the sender so it commits via the authoritative server echo instead of self-delivery.
        this.server.to(roomId).emit(ProbableWaffleGatewayEvent.ProbableWaffleAction, body);
      } else if (body.communicator === "pause-changed" || body.communicator === "desync-alert") {
        this.server.to(roomId).emit(ProbableWaffleGatewayEvent.ProbableWaffleAction, body);
      } else {
        // https://socket.io/docs/v3/emit-cheatsheet/
        socket.to(roomId).emit(ProbableWaffleGatewayEvent.ProbableWaffleAction, body);
      }

      this.roomServerService.emitCertainGameInstanceEventsToAllUsers(body, user);
      if (participantLeft) {
        this.handleParticipantLeft(body.gameInstanceId!, roomId, removedPlayerUserId);
      }
    } else if (!result.success && result.relayEmpty) {
      // Tick is authoritative but payload was invalid.  Relay an empty batch
      // WITH a rejectionReason so the sender can log what went wrong.
      const payload = body.payload as ProbableWaffleGameCommandEvent;
      const rejectedAsEmptyBatch = {
        ...body,
        payload: {
          ...payload,
          commands: [],
          rejectionReason: result.rejectionReason
        } satisfies ProbableWaffleGameCommandEvent
      };
      this.server.to(roomId).emit(ProbableWaffleGatewayEvent.ProbableWaffleAction, rejectedAsEmptyBatch);
    }
    // else: security/sequence violation — drop entirely; no relay of any kind.
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
        {
          const roomId = `${ProbableWaffleGatewayRoomTypes.ProbableWaffleGameInstance}${body.gameInstanceId}`;
          if (socket.rooms.has(roomId)) {
            console.log(`[Gateway] user=${user.id} socket=${socket.id} already joined room ${roomId}`);
            break;
          }
          socket.join(roomId);
          // Track socket ↔ player so we can handle disconnect gracefully.
          this.disconnectTracker.registerSocket(socket.id, user.id, body.gameInstanceId!);
          console.log(`[Gateway] user=${user.id} socket=${socket.id} joined room ${roomId}`);
          // If this player was previously disconnected, notify peers that they're back.
          const gameInstance = this.gameInstanceService.findGameInstance(body.gameInstanceId!);
          const player = gameInstance?.players.find((p) => p.playerController.data.userId === user.id);
          if (player?.playerNumber !== undefined) {
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
        {
          const leavingPlayer = this.disconnectTracker.markExplicitQuit(socket.id);
          const gameInstance = body.gameInstanceId ? this.gameInstanceService.findGameInstance(body.gameInstanceId) : null;
          const currentHostUserId =
            gameInstance?.gameInstanceMetadata?.data.currentHostUserId ?? gameInstance?.gameInstanceMetadata?.data.createdBy;
          if (leavingPlayer && currentHostUserId === leavingPlayer.userId) {
            this.emitHostMigration(leavingPlayer.gameInstanceId, leavingPlayer.userId);
          }
        }
        socket.leave(`${ProbableWaffleGatewayRoomTypes.ProbableWaffleGameInstance}${body.gameInstanceId}`);
        console.log(
          `[Gateway] user=${user.id} socket=${socket.id} left room ${ProbableWaffleGatewayRoomTypes.ProbableWaffleGameInstance}${body.gameInstanceId}`
        );
        break;
      default:
        throw new Error("Ashes of the Ancients - Web socket room broadcast - unknown communicator");
    }
  }

  private emitHostMigration(gameInstanceId: string, previousHostUserId: string): void {
    const migration = this.gameInstanceService.electReplacementHost(
      gameInstanceId,
      previousHostUserId,
      (userId, giId) => this.disconnectTracker.isUserDisconnected(userId, giId)
    );
    if (!migration) {
      return;
    }

    const roomId = `${ProbableWaffleGatewayRoomTypes.ProbableWaffleGameInstance}${gameInstanceId}`;
    this.server.to(roomId).emit(ProbableWaffleGatewayEvent.ProbableWaffleAction, {
      gameInstanceId,
      communicator: "gameInstanceMetadataDataChange",
      payload: {
        gameInstanceId,
        emitterUserId: null,
        property: "currentHostUserId",
        data: {
          currentHostUserId: migration.currentHostUserId
        }
      } satisfies ProbableWaffleGameInstanceMetadataChangeEvent
    });
    this.server.to(roomId).emit(ProbableWaffleGatewayEvent.ProbableWaffleAction, {
      gameInstanceId,
      communicator: "host-migrated",
      payload: {
        gameInstanceId,
        emitterUserId: null,
        previousHostUserId,
        currentHostUserId: migration.currentHostUserId,
        currentHostPlayerNumber: migration.currentHostPlayerNumber
      } satisfies ProbableWaffleHostMigratedEvent
    });
  }

  private getRemovedPlayerUserId(body: CommunicatorEvent<any, ProbableWaffleCommunicatorType>): string | null {
    if (body.communicator !== "playerDataChange") {
      return null;
    }

    const payload = body.payload as ProbableWafflePlayerDataChangeEvent;
    if (payload.property !== "left") {
      return null;
    }

    const playerNumber = payload.data.playerControllerData?.playerDefinition?.player.playerNumber;
    if (playerNumber === undefined) {
      return null;
    }

    const gameInstance = this.gameInstanceService.findGameInstance(body.gameInstanceId!);
    return gameInstance?.getPlayerByNumber(playerNumber)?.playerController.data.userId ?? null;
  }

  private isParticipantLeaving(body: CommunicatorEvent<any, ProbableWaffleCommunicatorType>): boolean {
    if (body.communicator === "playerDataChange") {
      return (body.payload as ProbableWafflePlayerDataChangeEvent).property === "left";
    }
    if (body.communicator === "spectatorDataChange") {
      return (body.payload as ProbableWaffleSpectatorDataChangeEvent).property === "left";
    }
    return false;
  }

  private handleParticipantLeft(gameInstanceId: string, roomId: string, removedPlayerUserId: string | null): void {
    const gameInstance = this.gameInstanceService.findGameInstance(gameInstanceId);
    if (!gameInstance) {
      return;
    }

    const currentHostUserId =
      gameInstance.gameInstanceMetadata.data.currentHostUserId ?? gameInstance.gameInstanceMetadata.data.createdBy;
    if (removedPlayerUserId && currentHostUserId === removedPlayerUserId) {
      this.emitHostMigration(gameInstanceId, removedPlayerUserId);
    }

    const remainingHumanPlayers = gameInstance.players.filter(
      (player) =>
        player.playerController.data.playerDefinition?.playerType === ProbableWafflePlayerType.Human &&
        player.playerController.data.userId !== null
    ).length;
    if (remainingHumanPlayers > 0) {
      return;
    }

    this.gameInstanceService.forceStopGameInstance(gameInstanceId);
    this.gameStateServerService.cleanup(gameInstanceId);
    this.server.to(roomId).emit(ProbableWaffleGatewayEvent.ProbableWaffleAction, {
      gameInstanceId,
      communicator: "gameInstanceMetadataDataChange",
      payload: {
        gameInstanceId,
        emitterUserId: null,
        property: "sessionState",
        data: {
          sessionState: GameSessionState.Stopped
        }
      } satisfies ProbableWaffleGameInstanceMetadataChangeEvent
    });
  }
}
