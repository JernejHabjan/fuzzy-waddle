// noinspection ES6PreferShortImport
import { ProbableWaffleMapEnum } from "../../probable-waffle/probable-waffle";
import { ChatMessage } from "../../chat/chat";

export type ProbableWaffleCommunicatorType = "score" | "message";

export interface ProbableWaffleCommunicatorEvent {
  gameInstanceId: string;
  emitterUserId: string | null;
}

export interface ProbableWaffleCommunicatorScoreEvent extends ProbableWaffleCommunicatorEvent {
  score: number;
  level: ProbableWaffleMapEnum;
}

export interface ProbableWaffleCommunicatorMessageEvent extends ProbableWaffleCommunicatorEvent {
  chatMessage: ChatMessage;
}

export interface ProbableWaffleWebsocketRoomEvent {
  gameInstanceId: string;
  type: "join" | "leave";
}

export enum ProbableWaffleGatewayEvent {
  ProbableWaffleRoom = "probable-waffle-room",
  ProbableWaffleAction = "probable-waffle-action",
  ProbableWaffleMessage = "probable-waffle-message",
  ProbableWaffleWebsocketRoom = "probable-waffle-websocket-room"
}
