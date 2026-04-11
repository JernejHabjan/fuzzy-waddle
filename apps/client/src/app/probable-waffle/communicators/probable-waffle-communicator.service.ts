import { EventEmitter, Injectable, type OnDestroy } from "@angular/core";
import {
  type AllScenesEventData,
  type GameInstanceId,
  type ProbableWaffleCommunicatorMessageEvent,
  type ProbableWaffleCommunicatorType,
  type ProbableWaffleGameCommandEvent,
  type ProbableWaffleGameInstanceMetadataChangeEvent,
  type ProbableWaffleGameModeDataChangeEvent,
  type ProbableWaffleGameStateDataChangeEvent,
  ProbableWaffleGatewayEvent,
  ProbableWaffleGatewayRoomTypes,
  type ProbableWafflePlayerDataChangeEvent,
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

@Injectable({
  providedIn: "root"
})
export class ProbableWaffleCommunicatorService
  implements CommunicatorService, OnDestroy, ProbableWaffleCommunicatorServiceInterface
{
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

  /**
   * utility events that are broadcast to game instance and other angular services - for example save game
   */
  utilityEvents = new EventEmitter<{ name: "save-game" | "load-game" | "settings" | "chat"; data?: any }>();
  /**
   * cross scene events - internal phaser events that are not related to game instance and are broadcast to all scenes
   */
  allScenes = new EventEmitter<AllScenesEventData>();

  startCommunication(gameInstanceId: GameInstanceId, socket?: Socket) {
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
    }

    socket?.emit(ProbableWaffleGatewayEvent.ProbableWaffleWebsocketRoom, {
      gameInstanceId,
      type: "join"
    } satisfies ProbableWaffleWebsocketRoomEvent);
  }

  stopCommunication(gameInstanceId: GameInstanceId, socket?: Socket) {
    this.destroySubscriptions();
    socket?.emit(ProbableWaffleGatewayRoomTypes.ProbableWaffleGameInstance, {
      gameInstanceId,
      type: "leave"
    } satisfies ProbableWaffleWebsocketRoomEvent);
  }

  ngOnDestroy(): void {
    this.destroySubscriptions();
  }

  private destroySubscriptions() {
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
  }
}
