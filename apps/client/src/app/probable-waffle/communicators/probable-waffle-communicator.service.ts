import { EventEmitter, Injectable, type OnDestroy } from "@angular/core";
import {
  type AllScenesEventData,
  type GameInstanceId,
  type ProbableWaffleCommunicatorMessageEvent,
  type ProbableWaffleCommunicatorType,
  type ProbableWaffleDesyncAlertEvent,
  type ProbableWaffleGameCommandEvent,
  type ProbableWaffleGameInstanceMetadataChangeEvent,
  type ProbableWaffleGameModeDataChangeEvent,
  type ProbableWaffleGameStateDataChangeEvent,
  ProbableWaffleGatewayEvent,
  type ProbableWaffleHostMigratedEvent,
  type ProbableWaffleInstanceReseedEvent,
  type ProbableWaffleInstanceReseedRequiredEvent,
  type ProbableWafflePauseChangedEvent,
  type ProbableWafflePlayerDataChangeEvent,
  type ProbableWafflePlayerDisconnectedEvent,
  type ProbableWafflePlayerReconnectedEvent,
  type ProbableWaffleSnapshotRequestEvent,
  type ProbableWaffleSnapshotResponseEvent,
  type ProbableWaffleSpectatorDataChangeEvent,
  type ProbableWaffleStateHashEvent,
  type ProbableWaffleWebsocketRoomEvent
} from "@fuzzy-waddle/api-interfaces";
import { TwoWayCommunicator } from "../../shared/game/communicators/two-way-communicator";
import { Socket } from "ngx-socket-io";
import type { CommunicatorService } from "../../shared/game/communicators/CommunicatorService";
import { type ProbableWaffleCommunicatorServiceInterface } from "./probable-waffle-communicator.service.interface";
import { createMultiplayerClientLogger } from "../game/world/services/multiplayer/multiplayer-client-logger";

@Injectable({
  providedIn: "root"
})
/**
 * Owns the client-side communicator graph for one active game instance.
 *
 * In multiplayer this service also owns socket room membership. Keeping that
 * join/leave behavior centralized avoids duplicating reconnect logic across the
 * lobby, game scene, and recovery services.
 */
export class ProbableWaffleCommunicatorService
  implements CommunicatorService, OnDestroy, ProbableWaffleCommunicatorServiceInterface
{
  private readonly logger = createMultiplayerClientLogger("Communicator");
  gameInstanceMetadataChanged?: TwoWayCommunicator<
    ProbableWaffleGameInstanceMetadataChangeEvent,
    ProbableWaffleCommunicatorType
  >;
  gameModeChanged?: TwoWayCommunicator<ProbableWaffleGameModeDataChangeEvent, ProbableWaffleCommunicatorType>;
  playerChanged?: TwoWayCommunicator<ProbableWafflePlayerDataChangeEvent, ProbableWaffleCommunicatorType>;
  spectatorChanged?: TwoWayCommunicator<ProbableWaffleSpectatorDataChangeEvent, ProbableWaffleCommunicatorType>;
  gameStateChanged?: TwoWayCommunicator<ProbableWaffleGameStateDataChangeEvent, ProbableWaffleCommunicatorType>;
  message?: TwoWayCommunicator<ProbableWaffleCommunicatorMessageEvent, ProbableWaffleCommunicatorType>;
  /** Command relay communicator; only initialised in multiplayer sessions. */
  gameCommandChanged?: TwoWayCommunicator<ProbableWaffleGameCommandEvent, ProbableWaffleCommunicatorType>;
  /** Periodic state-hash exchange; only initialised in multiplayer sessions. */
  stateHashChanged?: TwoWayCommunicator<ProbableWaffleStateHashEvent, ProbableWaffleCommunicatorType>;
  /** Snapshot request (reconnecting/spectating client → host); only in MP. */
  snapshotRequested?: TwoWayCommunicator<ProbableWaffleSnapshotRequestEvent, ProbableWaffleCommunicatorType>;
  /** Snapshot response (host → requesting client); only in MP. */
  snapshotResponse?: TwoWayCommunicator<ProbableWaffleSnapshotResponseEvent, ProbableWaffleCommunicatorType>;
  /** Server-originated signal that game instance is missing and needs reseed. */
  instanceReseedRequired?: TwoWayCommunicator<
    ProbableWaffleInstanceReseedRequiredEvent,
    ProbableWaffleCommunicatorType
  >;
  /** Client-originated payload used to recreate missing server game instance. */
  instanceReseed?: TwoWayCommunicator<ProbableWaffleInstanceReseedEvent, ProbableWaffleCommunicatorType>;
  /** Host-issued unresolved desync alert; only in MP. */
  desyncAlert?: TwoWayCommunicator<ProbableWaffleDesyncAlertEvent, ProbableWaffleCommunicatorType>;
  /** Multiplayer pause/resume relay; only in MP. */
  pauseChanged?: TwoWayCommunicator<ProbableWafflePauseChangedEvent, ProbableWaffleCommunicatorType>;
  /** Server-originated disconnect notification; only in MP. */
  playerDisconnected?: TwoWayCommunicator<ProbableWafflePlayerDisconnectedEvent, ProbableWaffleCommunicatorType>;
  /** Server-originated reconnect notification; only in MP. */
  playerReconnected?: TwoWayCommunicator<ProbableWafflePlayerReconnectedEvent, ProbableWaffleCommunicatorType>;
  /** Server-originated host migration event; only in MP. */
  hostMigrated?: TwoWayCommunicator<ProbableWaffleHostMigratedEvent, ProbableWaffleCommunicatorType>;

  /**
   * utility events that are broadcast to game instance and other angular services - for example save game
   */
  utilityEvents = new EventEmitter<{ name: "save-game" | "load-game" | "settings" | "chat"; data?: any }>();
  /**
   * cross scene events - internal phaser events that are not related to game instance and are broadcast to all scenes
   */
  allScenes = new EventEmitter<AllScenesEventData>();

  /** The active socket, if running in multiplayer. Exposed for reconnect handling. */
  activeSocket?: Socket;
  private activeGameInstanceId?: GameInstanceId;
  private socketConnectHandler?: () => void;
  private joinedSocketId?: string;
  private joinedGameInstanceId?: GameInstanceId;
  private rawSocket?: {
    on: (event: string, handler: () => void) => void;
    off?: (event: string, handler: () => void) => void;
    removeListener?: (event: string, handler: () => void) => void;
  };

  startCommunication(gameInstanceId: GameInstanceId, socket?: Socket) {
    this.destroySubscriptions();
    this.activeSocket = socket;
    this.activeGameInstanceId = gameInstanceId;
    this.gameInstanceMetadataChanged = new TwoWayCommunicator<
      ProbableWaffleGameInstanceMetadataChangeEvent,
      ProbableWaffleCommunicatorType
    >(ProbableWaffleGatewayEvent.ProbableWaffleAction, "gameInstanceMetadataDataChange", gameInstanceId, socket);

    this.gameModeChanged = new TwoWayCommunicator<
      ProbableWaffleGameModeDataChangeEvent,
      ProbableWaffleCommunicatorType
    >(ProbableWaffleGatewayEvent.ProbableWaffleAction, "gameModeDataChange", gameInstanceId, socket);

    this.playerChanged = new TwoWayCommunicator<ProbableWafflePlayerDataChangeEvent, ProbableWaffleCommunicatorType>(
      ProbableWaffleGatewayEvent.ProbableWaffleAction,
      "playerDataChange",
      gameInstanceId,
      socket
    );

    this.spectatorChanged = new TwoWayCommunicator<
      ProbableWaffleSpectatorDataChangeEvent,
      ProbableWaffleCommunicatorType
    >(ProbableWaffleGatewayEvent.ProbableWaffleAction, "spectatorDataChange", gameInstanceId, socket);

    this.gameStateChanged = new TwoWayCommunicator<
      ProbableWaffleGameStateDataChangeEvent,
      ProbableWaffleCommunicatorType
    >(ProbableWaffleGatewayEvent.ProbableWaffleAction, "gameStateDataChange", gameInstanceId, socket);

    this.message = new TwoWayCommunicator<ProbableWaffleCommunicatorMessageEvent, ProbableWaffleCommunicatorType>(
      ProbableWaffleGatewayEvent.ProbableWaffleMessage,
      "message",
      gameInstanceId,
      socket
    );

    // Only initialise in multiplayer (socket present); single-player stays undefined.
    if (socket) {
      this.gameCommandChanged = new TwoWayCommunicator<ProbableWaffleGameCommandEvent, ProbableWaffleCommunicatorType>(
        ProbableWaffleGatewayEvent.ProbableWaffleAction,
        "game-command",
        gameInstanceId,
        socket
      );
      this.stateHashChanged = new TwoWayCommunicator<ProbableWaffleStateHashEvent, ProbableWaffleCommunicatorType>(
        ProbableWaffleGatewayEvent.ProbableWaffleAction,
        "state-hash",
        gameInstanceId,
        socket
      );
      this.snapshotRequested = new TwoWayCommunicator<
        ProbableWaffleSnapshotRequestEvent,
        ProbableWaffleCommunicatorType
      >(ProbableWaffleGatewayEvent.ProbableWaffleAction, "snapshot-request", gameInstanceId, socket);
      this.snapshotResponse = new TwoWayCommunicator<
        ProbableWaffleSnapshotResponseEvent,
        ProbableWaffleCommunicatorType
      >(ProbableWaffleGatewayEvent.ProbableWaffleAction, "snapshot-response", gameInstanceId, socket);
      this.instanceReseedRequired = new TwoWayCommunicator<
        ProbableWaffleInstanceReseedRequiredEvent,
        ProbableWaffleCommunicatorType
      >(ProbableWaffleGatewayEvent.ProbableWaffleAction, "instance-reseed-required", gameInstanceId, socket);
      this.instanceReseed = new TwoWayCommunicator<ProbableWaffleInstanceReseedEvent, ProbableWaffleCommunicatorType>(
        ProbableWaffleGatewayEvent.ProbableWaffleAction,
        "instance-reseed",
        gameInstanceId,
        socket
      );
      this.desyncAlert = new TwoWayCommunicator<ProbableWaffleDesyncAlertEvent, ProbableWaffleCommunicatorType>(
        ProbableWaffleGatewayEvent.ProbableWaffleAction,
        "desync-alert",
        gameInstanceId,
        socket
      );
      this.pauseChanged = new TwoWayCommunicator<ProbableWafflePauseChangedEvent, ProbableWaffleCommunicatorType>(
        ProbableWaffleGatewayEvent.ProbableWaffleAction,
        "pause-changed",
        gameInstanceId,
        socket
      );
      this.playerDisconnected = new TwoWayCommunicator<
        ProbableWafflePlayerDisconnectedEvent,
        ProbableWaffleCommunicatorType
      >(ProbableWaffleGatewayEvent.ProbableWaffleAction, "player-disconnected", gameInstanceId, socket);
      this.playerReconnected = new TwoWayCommunicator<
        ProbableWafflePlayerReconnectedEvent,
        ProbableWaffleCommunicatorType
      >(ProbableWaffleGatewayEvent.ProbableWaffleAction, "player-reconnected", gameInstanceId, socket);
      this.hostMigrated = new TwoWayCommunicator<ProbableWaffleHostMigratedEvent, ProbableWaffleCommunicatorType>(
        ProbableWaffleGatewayEvent.ProbableWaffleAction,
        "host-migrated",
        gameInstanceId,
        socket
      );
    }

    if (socket) {
      // Register once and also join immediately. The immediate emit covers the
      // already-connected case, while the connect listener covers reconnects
      // that come back with a new socket id and would otherwise miss room relay.
      this.socketConnectHandler = () => {
        this.logger.info(`[Communicator] Joining game room after connect. gameInstanceId=${gameInstanceId}`);
        this.emitRoomMembership(socket, gameInstanceId, "join");
      };
      const rawSocket = (socket as any).ioSocket;
      if (rawSocket) {
        this.rawSocket = rawSocket;
        rawSocket.on("connect", this.socketConnectHandler);
      }
      this.emitRoomMembership(socket, gameInstanceId, "join");
    }
  }

  stopCommunication(gameInstanceId: GameInstanceId, socket?: Socket) {
    this.destroySubscriptions();
    if (socket) {
      this.emitRoomMembership(socket, gameInstanceId, "leave");
    }
  }

  ngOnDestroy(): void {
    this.destroySubscriptions();
  }

  private destroySubscriptions() {
    if (this.rawSocket && this.socketConnectHandler) {
      this.rawSocket.off?.("connect", this.socketConnectHandler);
      this.rawSocket.removeListener?.("connect", this.socketConnectHandler);
    }
    this.rawSocket = undefined;
    this.socketConnectHandler = undefined;
    this.joinedSocketId = undefined;
    this.joinedGameInstanceId = undefined;
    this.activeSocket = undefined;
    this.activeGameInstanceId = undefined;
    this.gameInstanceMetadataChanged?.destroy();
    this.gameModeChanged?.destroy();
    this.playerChanged?.destroy();
    this.spectatorChanged?.destroy();
    this.gameStateChanged?.destroy();
    this.message?.destroy();
    this.gameCommandChanged?.destroy();
    this.stateHashChanged?.destroy();
    this.snapshotRequested?.destroy();
    this.snapshotResponse?.destroy();
    this.instanceReseedRequired?.destroy();
    this.instanceReseed?.destroy();
    this.desyncAlert?.destroy();
    this.pauseChanged?.destroy();
    this.playerDisconnected?.destroy();
    this.playerReconnected?.destroy();
    this.hostMigrated?.destroy();
  }

  private emitRoomMembership(
    socket: Socket,
    gameInstanceId: GameInstanceId,
    type: ProbableWaffleWebsocketRoomEvent["type"]
  ): void {
    const socketId = (socket as any).ioSocket?.id as string | undefined;
    if (
      type === "join" &&
      socketId &&
      this.joinedSocketId === socketId &&
      this.joinedGameInstanceId === gameInstanceId
    ) {
      // Room joins are idempotent from the gameplay perspective, but suppressing
      // duplicate emits keeps reconnect debugging readable and avoids redundant
      // tracker updates on the API side.
      return;
    }

    socket.emit(ProbableWaffleGatewayEvent.ProbableWaffleWebsocketRoom, {
      gameInstanceId,
      type
    } satisfies ProbableWaffleWebsocketRoomEvent);

    if (type === "join") {
      this.joinedSocketId = socketId;
      this.joinedGameInstanceId = gameInstanceId;
      return;
    }

    if (this.joinedGameInstanceId === gameInstanceId) {
      this.joinedSocketId = undefined;
      this.joinedGameInstanceId = undefined;
    }
  }
}
