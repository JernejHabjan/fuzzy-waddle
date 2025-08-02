import { EventEmitter, Injectable, OnDestroy } from "@angular/core";
import {
  ProbableWaffleCommunicatorMessageEvent,
  ProbableWaffleCommunicatorType,
  ProbableWaffleGameInstanceMetadataChangeEvent,
  ProbableWaffleGameModeDataChangeEvent,
  ProbableWaffleGameStateDataChangeEvent,
  ProbableWaffleGatewayEvent,
  ProbableWaffleGatewayRoomTypes,
  ProbableWafflePlayerDataChangeEvent,
  ProbableWaffleSpectatorDataChangeEvent,
  ProbableWaffleWebsocketRoomEvent
} from "@fuzzy-waddle/api-interfaces";
import { TwoWayCommunicator } from "../../shared/game/communicators/two-way-communicator";
import { Socket } from "ngx-socket-io";
import { CommunicatorService } from "../../shared/game/communicators/CommunicatorService";
import { ProbableWaffleCommunicatorServiceInterface } from "./probable-waffle-communicator.service.interface";

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

  /**
   * utility events that are broadcast to game instance and other angular services - for example save game
   */
  utilityEvents = new EventEmitter<{ name: "save-game" | "load-game" | "settings"; data?: any }>();
  /**
   * cross scene events - internal phaser events that are not related to game instance and are broadcast to all scenes
   */
  allScenes = new EventEmitter<{
    name:
      | "save-game"
      | "restart-game"
      | "selection.deselect"
      | "selection.singleSelect"
      | "selection.doubleSelect"
      | "selection.multiSelect"
      | "selection.multiSelectPreview"
      | "selection.terrainSelect";
    data?: any;
  }>();

  startCommunication(gameInstanceId: string, socket?: Socket) {
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

    socket?.emit(ProbableWaffleGatewayEvent.ProbableWaffleWebsocketRoom, {
      gameInstanceId,
      type: "join"
    } satisfies ProbableWaffleWebsocketRoomEvent);
  }

  stopCommunication(gameInstanceId: string, socket?: Socket) {
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
  }
}
