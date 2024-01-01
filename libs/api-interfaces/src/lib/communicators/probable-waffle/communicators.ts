// noinspection ES6PreferShortImport
import { ChatMessage } from "../../chat/chat";
import { ProbableWaffleGameInstanceMetadataData } from "../../game-instance/probable-waffle/game-instance-medatada";
import { ProbableWaffleGameModeData } from "../../game-instance/probable-waffle/game-mode";
import {
  ProbableWafflePlayerControllerData,
  ProbableWafflePlayerStateData
} from "../../game-instance/probable-waffle/player";
import { ProbableWaffleSpectatorData } from "../../game-instance/probable-waffle/spectator";

export type ProbableWaffleCommunicatorType =
  | "gameInstanceMetadataDataChange"
  | "gameModeDataChange"
  | "playerDataChange"
  | "spectatorDataChange"
  | "message";

export interface ProbableWaffleCommunicatorEvent {
  gameInstanceId: string;
  emitterUserId: string | null;
}

export type RecursiveKeyOf<TObj extends object> = {
  [TKey in keyof TObj & (string | number)]: TObj[TKey] extends any[]
    ? `${TKey}`
    : TObj[TKey] extends object
    ? `${TKey}` | `${TKey}.${RecursiveKeyOf<TObj[TKey]>}`
    : `${TKey}`;
}[keyof TObj & (string | number)];

export type ProbableWaffleAllChanged = "all";

export type ProbableWaffleDataChangeEventProperty<T extends object> = RecursiveKeyOf<T> | ProbableWaffleAllChanged;

export interface ProbableWaffleGameInstanceMetadataChangeEvent extends ProbableWaffleCommunicatorEvent {
  property: ProbableWaffleDataChangeEventProperty<ProbableWaffleGameInstanceMetadataData>;
  data: Partial<ProbableWaffleGameInstanceMetadataData>;
}

export interface ProbableWaffleGameModeDataChangeEvent extends ProbableWaffleCommunicatorEvent {
  property: ProbableWaffleDataChangeEventProperty<ProbableWaffleGameModeData>;
  data: Partial<ProbableWaffleGameModeData>;
}

export type ProbableWafflePlayerDataChangeEventPayload = Partial<{
  playerStateData: Partial<ProbableWafflePlayerStateData>;
  playerControllerData: Partial<ProbableWafflePlayerControllerData>;
}>;

export type ProbableWafflePlayerDataChangeEventProperty =
  | (ProbableWaffleDataChangeEventProperty<ProbableWafflePlayerStateData> &
      ProbableWaffleDataChangeEventProperty<ProbableWafflePlayerControllerData>)
  | "joined"
  | "left";
export interface ProbableWafflePlayerDataChangeEvent extends ProbableWaffleCommunicatorEvent {
  property: ProbableWafflePlayerDataChangeEventProperty;
  data: ProbableWafflePlayerDataChangeEventPayload;
}

export type ProbableWaffleSpectatorDataChangeEventProperty =
  | ProbableWaffleDataChangeEventProperty<ProbableWaffleSpectatorData>
  | "joined"
  | "left";
export interface ProbableWaffleSpectatorDataChangeEvent extends ProbableWaffleCommunicatorEvent {
  property: ProbableWaffleSpectatorDataChangeEventProperty;
  data: Partial<ProbableWaffleSpectatorData>;
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
