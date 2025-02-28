// noinspection ES6PreferShortImport
import { ChatMessage } from "../../chat/chat";
import { ProbableWaffleGameInstanceMetadataData } from "../../game-instance/probable-waffle/game-instance-medatada";
import { ProbableWaffleGameModeData } from "../../game-instance/probable-waffle/game-mode";
import {
  ProbableWafflePlayer,
  ProbableWafflePlayerControllerData,
  ProbableWafflePlayerStateData
} from "../../game-instance/probable-waffle/player";
import { ProbableWaffleSpectatorData } from "../../game-instance/probable-waffle/spectator";
import { ActorDefinition, ProbableWaffleGameStateData } from "../../game-instance/probable-waffle/game-state";

export type ProbableWaffleGameCommunicatorType = "selection";

export type ProbableWaffleCommunicatorType =
  | "gameInstanceMetadataDataChange"
  | "gameModeDataChange"
  | "playerDataChange"
  | "spectatorDataChange"
  | "gameStateDataChange"
  | "message"
  | ProbableWaffleGameCommunicatorType;

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
}[keyof TObj &
  (string | number) &
  Exclude<keyof TObj, keyof Date> &
  Exclude<keyof TObj, keyof number> &
  Exclude<keyof TObj, keyof boolean> &
  Exclude<keyof TObj, keyof string> &
  Exclude<keyof TObj, keyof Map<any, any>>];

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
  // provide player number only when updating player
  playerNumber?: number;
  playerStateData: Partial<ProbableWafflePlayerStateData>;
  playerControllerData: Partial<ProbableWafflePlayerControllerData>;
  data: Record<string, any>;
}>;

export type ProbableWafflePlayerDataChangeEventProperty =
  | ProbableWaffleDataChangeEventProperty<ProbableWafflePlayer>
  | "joined"
  | "left"
  | "joinedFromNetwork"
  | "selection.added"
  | "selection.removed"
  | "selection.set"
  | "selection.cleared"
  | "resource.added"
  | "resource.removed"
  | "command.issued.move" // todo this command needs to be removed from here as it belongs to actor event
  | "command.issued.actor"; // todo this command needs to be removed from here as it belongs to actor event
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

export type ProbableWaffleGameStateDataChangeEventProperty =
  | ProbableWaffleDataChangeEventProperty<ProbableWaffleGameStateData>
  | RecursiveKeyOf<ActorDefinition>;

export type ProbableWaffleGameStateDataPayload = Partial<{
  actorDefinition: Partial<
    {
      id: string;
    } & Partial<ActorDefinition>
  >;
  gameState: Partial<ProbableWaffleGameStateData>;
}>;

export interface ProbableWaffleGameStateDataChangeEvent extends ProbableWaffleCommunicatorEvent {
  property: ProbableWaffleGameStateDataChangeEventProperty;
  data: ProbableWaffleGameStateDataPayload;
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
