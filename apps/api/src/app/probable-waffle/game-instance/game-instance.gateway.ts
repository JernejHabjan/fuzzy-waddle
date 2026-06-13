import { BadRequestException, Logger, UseGuards } from "@nestjs/common";
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
  GameSessionState,
  type ProbableWaffleCommunicatorMessageEvent,
  ProbableWaffleCommunicators,
  type ProbableWaffleCommunicatorEventUnion,
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
  type ProbableWaffleSnapshotResponseEvent,
  type ProbableWaffleSpectatorDataChangeEvent,
  type ProbableWaffleWebsocketRoomEvent
} from "@fuzzy-waddle/api-interfaces";
import { ProbableWaffleChatService } from "../chat/probable-waffle-chat.service";
import { type AuthUser } from "@supabase/supabase-js";
import { OnlineAccessGuard } from "../../../auth/guards/online-access.guard";
import { CurrentUser } from "../../../auth/current-user";
import { GameStateServerService, type UpdateGameStateResult } from "./game-state-server.service";
import { RoomServerService } from "../game-room/room-server.service";
import { ChatService } from "../../chat/chat.service";
import { PlayerDisconnectTrackerService } from "./multiplayer/player-disconnect-tracker.service";
import { GameInstanceService } from "./game-instance.service";
import { SocketConnectionAuthService } from "../../../auth/socket-connection-auth.service";

const RECONNECT_WINDOW_SECONDS = 60;

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",")
  }
})
export class GameInstanceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(GameInstanceGateway.name);
  private readonly debug = process.env.PROBABLE_WAFFLE_MULTIPLAYER_DEBUG === "true";
  @WebSocketServer() private readonly server!: Server;

  constructor(
    private readonly gameStateServerService: GameStateServerService,
    private readonly probableWaffleChatService: ProbableWaffleChatService,
    private readonly roomServerService: RoomServerService,
    private readonly chatService: ChatService,
    private readonly disconnectTracker: PlayerDisconnectTrackerService,
    private readonly gameInstanceService: GameInstanceService,
    private readonly socketConnectionAuthService: SocketConnectionAuthService
  ) {}

  emitGameFound(probableWaffleGameFoundEvent: ProbableWaffleGameFoundEvent) {
    this.server.emit(ProbableWaffleGameInstanceEvent.GameFound, probableWaffleGameFoundEvent);
  }

  async handleConnection(socket: Socket): Promise<void> {
    await this.socketConnectionAuthService.disconnectUnauthenticatedClient(socket);
    this.debugLog(`socket connect socketId=${socket.id} transport=${socket.conn.transport.name}`);
    socket.on("disconnect", (reason) => {
      this.debugLog(`socket disconnect reason socketId=${socket.id} reason=${reason}`);
    });
  }

  handleDisconnect(socket: Socket): void {
    this.debugLog(`socket disconnect socketId=${socket.id}`);
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
        communicator: ProbableWaffleCommunicators.PlayerDisconnected,
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
        communicator: ProbableWaffleCommunicators.PlayerDisconnected,
        payload: {
          gameInstanceId: playerInfo.gameInstanceId,
          emitterUserId: null,
          playerNumber,
          reconnectWindowSeconds: RECONNECT_WINDOW_SECONDS
        } satisfies ProbableWafflePlayerDisconnectedEvent
      });

      const currentHostUserId =
        gameInstance.gameInstanceMetadata.data.currentHostUserId ?? gameInstance.gameInstanceMetadata.data.createdBy;
      if (currentHostUserId === playerInfo.userId) {
        this.emitHostMigration(playerInfo.gameInstanceId, playerInfo.userId);
      }
    }
  }

  @UseGuards(OnlineAccessGuard)
  @SubscribeMessage(ProbableWaffleGatewayEvent.ProbableWaffleAction)
  /**
   * Main relay path for gameplay events.
   *
   * Relay policy is intentionally communicator-specific:
   * - authoritative lockstep streams (commands, pause, desync) are room-broadcast
   * - lobby/state metadata uses sender-excluded relay to avoid duplicate local effects
   * - reseed payload is ingestion-only and never echoed back by default
   */
  async broadcastProbableWaffleAction(
    @CurrentUser() user: AuthUser,
    @MessageBody() body: ProbableWaffleCommunicatorEventUnion,
    @ConnectedSocket() socket: Socket
  ) {
    this.debugLog(
      `action communicator=${body.communicator} game=${body.gameInstanceId} user=${user.id} socket=${socket.id}`
    );
    this.gameStateServerService.ensureAuthorizedMutation(body, user);

    const removedPlayerUserId = this.getRemovedPlayerUserId(body);
    const participantLeft = this.isParticipantLeaving(body);
    const result: UpdateGameStateResult = this.gameStateServerService.updateGameState(body, user);
    const roomId = `${ProbableWaffleGatewayRoomTypes.ProbableWaffleGameInstance}${body.gameInstanceId}`;
    if (result.success) {
      if (body.communicator === ProbableWaffleCommunicators.GameCommand) {
        // Include the sender so it commits via the authoritative server echo instead of self-delivery.
        this.server.to(roomId).emit(ProbableWaffleGatewayEvent.ProbableWaffleAction, body);
      } else if (body.communicator === ProbableWaffleCommunicators.InstanceReseed) {
        // Reseed payload is server-ingestion only; do not rebroadcast full instance blobs.
      } else if (body.communicator === ProbableWaffleCommunicators.SnapshotResponse) {
        const payload = body.payload as ProbableWaffleSnapshotResponseEvent;
        this.emitTargetedActionToUser(payload.targetUserId, body);
      } else if (
        body.communicator === ProbableWaffleCommunicators.PauseChanged ||
        body.communicator === ProbableWaffleCommunicators.DesyncAlert
      ) {
        this.server.to(roomId).emit(ProbableWaffleGatewayEvent.ProbableWaffleAction, body);
      } else {
        // https://socket.io/docs/v3/emit-cheatsheet/
        socket.to(roomId).emit(ProbableWaffleGatewayEvent.ProbableWaffleAction, body);
      }

      this.roomServerService.emitCertainGameInstanceEventsToAllUsers(body, user);
      if (participantLeft) {
        this.handleParticipantLeft(body.gameInstanceId!, roomId, removedPlayerUserId);
      }
    } else if (!result.success && result.relayEmpty === false && "reseedRequired" in result && result.reseedRequired) {
      this.server.to(roomId).emit(ProbableWaffleGatewayEvent.ProbableWaffleAction, {
        gameInstanceId: body.gameInstanceId,
        communicator: ProbableWaffleCommunicators.InstanceReseedRequired,
        payload: {
          gameInstanceId: body.gameInstanceId,
          emitterUserId: null,
          reason: "missing-game-instance"
        }
      });
    } else if (!result.success && result.relayEmpty) {
      // Tick is authoritative but payload was invalid.  Relay an empty batch
      // WITH a rejectionReason so the sender can log what went wrong.
      const payload = body.payload as ProbableWaffleGameCommandEvent;
      const rejectedAsEmptyBatch = {
        ...body,
        payload: {
          ...payload,
          tick: result.overrideTick ?? payload.tick,
          commands: [],
          rejectionReason: result.rejectionReason
        } satisfies ProbableWaffleGameCommandEvent
      };
      this.server.to(roomId).emit(ProbableWaffleGatewayEvent.ProbableWaffleAction, rejectedAsEmptyBatch);
    }
    // else: security/sequence violation — drop entirely; no relay of any kind.
  }

  @UseGuards(OnlineAccessGuard)
  @SubscribeMessage(ProbableWaffleGatewayEvent.ProbableWaffleMessage)
  async broadcastProbableWaffleMessage(
    @CurrentUser() user: AuthUser,
    @MessageBody() body: ProbableWaffleCommunicatorEventUnion,
    @ConnectedSocket() socket: Socket
  ) {
    console.log(`Ashes of the Ancients - GI chat message ${body.gameInstanceId}`);
    if (!body.gameInstanceId) {
      throw new BadRequestException("Game instance ID is required");
    }
    this.gameStateServerService.ensureCanAccessGameRoom(body.gameInstanceId, user);

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
        {
          const roomId = `${ProbableWaffleGatewayRoomTypes.ProbableWaffleGameInstance}${body.gameInstanceId}`;
          if (socket.rooms.has(roomId)) {
            this.debugLog(`user=${user.id} socket=${socket.id} already joined room ${roomId}`);
            break;
          }
          socket.join(roomId);
          // Track socket ↔ player so we can handle disconnect gracefully.
          this.disconnectTracker.registerSocket(socket.id, user.id, body.gameInstanceId!);
          this.debugLog(`user=${user.id} socket=${socket.id} joined room ${roomId}`);
          // If this player was previously disconnected, notify peers that they're back.
          const gameInstance = this.gameInstanceService.findGameInstance(body.gameInstanceId!);
          const player = gameInstance?.players.find((p) => p.playerController.data.userId === user.id);
          if (player?.playerNumber !== undefined) {
            // Notify other clients (not the rejoining socket itself)
            socket.to(roomId).emit(ProbableWaffleGatewayEvent.ProbableWaffleAction, {
              gameInstanceId: body.gameInstanceId,
              communicator: ProbableWaffleCommunicators.PlayerReconnected,
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
          const gameInstance = body.gameInstanceId
            ? this.gameInstanceService.findGameInstance(body.gameInstanceId)
            : null;
          const currentHostUserId =
            gameInstance?.gameInstanceMetadata?.data.currentHostUserId ??
            gameInstance?.gameInstanceMetadata?.data.createdBy;
          if (leavingPlayer && currentHostUserId === leavingPlayer.userId) {
            this.emitHostMigration(leavingPlayer.gameInstanceId, leavingPlayer.userId);
          }
        }
        socket.leave(`${ProbableWaffleGatewayRoomTypes.ProbableWaffleGameInstance}${body.gameInstanceId}`);
        this.debugLog(
          `user=${user.id} socket=${socket.id} left room ${ProbableWaffleGatewayRoomTypes.ProbableWaffleGameInstance}${body.gameInstanceId}`
        );
        break;
      default:
        throw new Error("Ashes of the Ancients - Web socket room broadcast - unknown communicator");
    }
  }

  /**
   * Delivers one action to all active sockets of exactly one user.
   *
   * This exists for reconnect snapshot responses so large snapshot payloads are
   * not room-broadcast and discarded client-side by non-target peers.
   */
  private emitTargetedActionToUser(targetUserId: string, body: ProbableWaffleCommunicatorEventUnion): void {
    const socketIds = this.disconnectTracker.getActiveSocketIdsForPlayer(targetUserId, body.gameInstanceId!);
    if (socketIds.length === 0) {
      console.warn(
        `[Gateway] Unable to deliver targeted ${body.communicator} for game=${body.gameInstanceId} targetUser=${targetUserId}: no active socket`
      );
      return;
    }

    for (const socketId of socketIds) {
      this.server.to(socketId).emit(ProbableWaffleGatewayEvent.ProbableWaffleAction, body);
    }
    this.debugLog(
      `targeted relay communicator=${body.communicator} game=${body.gameInstanceId} targetUser=${targetUserId} sockets=${socketIds.length}`
    );
  }

  /** Promotes the next eligible human player and broadcasts both metadata and migration events. */
  private emitHostMigration(gameInstanceId: string, previousHostUserId: string): void {
    const migration = this.gameInstanceService.electReplacementHost(
      gameInstanceId,
      previousHostUserId,
      (userId, giId) => this.disconnectTracker.isUserDisconnected(userId, giId)
    );
    if (!migration) {
      this.logger.warn(`[HostMigration] No eligible replacement host for game=${gameInstanceId}`);
      return;
    }
    this.logger.warn(
      `[HostMigration] game=${gameInstanceId} previousHost=${previousHostUserId} currentHost=${migration.currentHostUserId} currentHostPlayer=${migration.currentHostPlayerNumber}`
    );

    const roomId = `${ProbableWaffleGatewayRoomTypes.ProbableWaffleGameInstance}${gameInstanceId}`;
    this.server.to(roomId).emit(ProbableWaffleGatewayEvent.ProbableWaffleAction, {
      gameInstanceId,
      communicator: ProbableWaffleCommunicators.GameInstanceMetadataDataChange,
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
      communicator: ProbableWaffleCommunicators.HostMigrated,
      payload: {
        gameInstanceId,
        emitterUserId: null,
        previousHostUserId,
        currentHostUserId: migration.currentHostUserId,
        currentHostPlayerNumber: migration.currentHostPlayerNumber
      } satisfies ProbableWaffleHostMigratedEvent
    });
  }

  /** Resolves the userId being removed by a `player.left` payload so host transfer logic can react. */
  private getRemovedPlayerUserId(body: ProbableWaffleCommunicatorEventUnion): string | null {
    if (body.communicator !== ProbableWaffleCommunicators.PlayerDataChange) {
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

  /** True when this action removes a player or spectator from the game instance. */
  private isParticipantLeaving(body: ProbableWaffleCommunicatorEventUnion): boolean {
    if (body.communicator === ProbableWaffleCommunicators.PlayerDataChange) {
      return (body.payload as ProbableWafflePlayerDataChangeEvent).property === "left";
    }
    if (body.communicator === ProbableWaffleCommunicators.SpectatorDataChange) {
      return (body.payload as ProbableWaffleSpectatorDataChangeEvent).property === "left";
    }
    return false;
  }

  /**
   * Handles side effects of departures:
   * - host migration when the current host left
   * - forced game stop when no human players remain
   */
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
      communicator: ProbableWaffleCommunicators.GameInstanceMetadataDataChange,
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

  private debugLog(message: string): void {
    if (!this.debug) {
      return;
    }
    this.logger.debug(`[Multiplayer] ${message}`);
  }
}
