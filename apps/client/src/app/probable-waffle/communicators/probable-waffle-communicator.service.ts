import { Injectable } from "@angular/core";
import {
  ProbableWaffleCommunicatorMessageEvent,
  ProbableWaffleCommunicatorType,
  ProbableWaffleGameInstanceMetadataChangeEvent,
  ProbableWaffleGameModeDataChangeEvent,
  ProbableWaffleGatewayEvent,
  ProbableWaffleGatewayRoomTypes,
  ProbableWafflePlayerDataChangeEvent,
  ProbableWaffleSpectatorDataChangeEvent,
  ProbableWaffleWebsocketRoomEvent
} from "@fuzzy-waddle/api-interfaces";
import { TwoWayCommunicator } from "../../shared/game/communicators/two-way-communicator";
import { Socket } from "ngx-socket-io";

export const probableWaffleCommunicatorServiceStub = {
  startCommunication: () => {},
  stopCommunication: () => {}
};

@Injectable({
  providedIn: "root"
})
export class ProbableWaffleCommunicatorService {
  gameInstanceMetadataChanged?: TwoWayCommunicator<
    ProbableWaffleGameInstanceMetadataChangeEvent,
    ProbableWaffleCommunicatorType
  >;
  gameModeChanged?: TwoWayCommunicator<ProbableWaffleGameModeDataChangeEvent, ProbableWaffleCommunicatorType>;
  playerChanged?: TwoWayCommunicator<ProbableWafflePlayerDataChangeEvent, ProbableWaffleCommunicatorType>;
  spectatorChanged?: TwoWayCommunicator<ProbableWaffleSpectatorDataChangeEvent, ProbableWaffleCommunicatorType>;
  message?: TwoWayCommunicator<ProbableWaffleCommunicatorMessageEvent, ProbableWaffleCommunicatorType>;

  startCommunication(gameInstanceId: string, socket: Socket) {
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

    this.message = new TwoWayCommunicator<ProbableWaffleCommunicatorMessageEvent, ProbableWaffleCommunicatorType>(
      ProbableWaffleGatewayEvent.ProbableWaffleMessage,
      "message",
      gameInstanceId,
      socket
    );

    socket.emit(ProbableWaffleGatewayEvent.ProbableWaffleWebsocketRoom, {
      gameInstanceId,
      type: "join"
    } satisfies ProbableWaffleWebsocketRoomEvent);
  }

  stopCommunication(gameInstanceId: string, socket: Socket) {
    this.gameInstanceMetadataChanged?.destroy();
    this.gameModeChanged?.destroy();
    this.playerChanged?.destroy();
    this.spectatorChanged?.destroy();
    this.message?.destroy();
    socket.emit(ProbableWaffleGatewayRoomTypes.ProbableWaffleGameInstance, {
      gameInstanceId,
      type: "leave"
    } satisfies ProbableWaffleWebsocketRoomEvent);
  }
}
