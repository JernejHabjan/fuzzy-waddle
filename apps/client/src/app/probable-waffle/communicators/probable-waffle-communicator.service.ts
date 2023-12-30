import { Injectable, OnDestroy } from "@angular/core";
import {
  LittleMuncherCommunicatorType,
  ProbableWaffleCommunicatorMessageEvent,
  ProbableWaffleCommunicatorScoreEvent,
  ProbableWaffleCommunicatorType,
  ProbableWaffleGatewayEvent,
  ProbableWaffleGatewayRoomTypes,
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
  score?: TwoWayCommunicator<ProbableWaffleCommunicatorScoreEvent, ProbableWaffleCommunicatorType>;
  message?: TwoWayCommunicator<ProbableWaffleCommunicatorMessageEvent, ProbableWaffleCommunicatorType>;

  startCommunication(gameInstanceId: string, socket: Socket) {
    this.score = new TwoWayCommunicator<ProbableWaffleCommunicatorScoreEvent, ProbableWaffleCommunicatorType>(
      ProbableWaffleGatewayEvent.ProbableWaffleAction,
      "score",
      gameInstanceId,
      socket
    );

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
    this.score?.destroy();
    this.message?.destroy();
    socket.emit(ProbableWaffleGatewayRoomTypes.ProbableWaffleGameInstance, {
      gameInstanceId,
      type: "leave"
    } satisfies ProbableWaffleWebsocketRoomEvent);
  }
}
