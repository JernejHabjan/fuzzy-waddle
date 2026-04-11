import type { ChatMessage } from "../../chat/chat";
import type { ProbableWaffleGameInstanceMetadataData } from "../../game-instance/probable-waffle/game-instance-medatada";
import type { ProbableWaffleGameModeData } from "../../game-instance/probable-waffle/game-mode";
import {
  ProbableWafflePlayer,
  type ProbableWafflePlayerControllerData,
  type ProbableWafflePlayerStateData
} from "../../game-instance/probable-waffle/player";
import type { ProbableWaffleSpectatorData } from "../../game-instance/probable-waffle/spectator";
import type { ActorDefinition, ProbableWaffleGameStateData } from "../../game-instance/probable-waffle/game-state";
import type { GameInstanceId, PlayerNumber, UserId } from "../../game-instance/player/player";

export type ProbableWaffleGameCommunicatorType = "selection";

export type ProbableWaffleCommunicatorType =
  | "gameInstanceMetadataDataChange"
  | "gameModeDataChange"
  | "playerDataChange"
  | "spectatorDataChange"
  | "gameStateDataChange"
  | "message"
  | "game-command"
  | "state-hash"
  | "snapshot-request"
  | "snapshot-response"
  | "player-disconnected"
  | "player-reconnected"
  | ProbableWaffleGameCommunicatorType;

export interface ProbableWaffleCommunicatorEvent {
  gameInstanceId: GameInstanceId;
  emitterUserId: UserId | null;
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
  playerNumber?: PlayerNumber;
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
  | "housing.added"
  | "housing.removed"
  | "housing.current.increased"
  | "housing.current.decreased"
  | "player.scene-ready"
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

/**
 * Carries one player's committed command batch for a given simulation tick.
 * Sent by every player on every tick (even if commands is empty) so peers can
 * advance the lockstep barrier.
 *
 * Commands are typed as unknown[] here because GameCommand is defined in the
 * client app. The receiving client casts them to GameCommand[] after validation.
 */
export interface ProbableWaffleGameCommandEvent extends ProbableWaffleCommunicatorEvent {
  /** The simulation tick on which these commands should execute. */
  tick: number;
  playerNumber: PlayerNumber;
  /** Serialised GameCommand objects. Cast to GameCommand[] on the client. */
  commands: unknown[];
}

/** Periodic state-hash snapshot. Each client broadcasts its own hash; peers compare. */
export interface ProbableWaffleStateHashEvent extends ProbableWaffleCommunicatorEvent {
  /** The simulation tick at which this hash was computed. */
  tick: number;
  playerNumber: PlayerNumber;
  /** djb2 hex hash of all actor states sorted by actor ID. */
  hash: string;
}

/** Full simulation snapshot for reconnect / spectator catch-up. Host → requesting client only. */
export interface ProbableWaffleSnapshotData {
  /** Simulation tick at the moment the snapshot was taken. */
  tick: number;
  /** All live actors serialised via ActorManager.getActorDefinitionFromActor(). */
  actors: ActorDefinition[];
  /**
   * Per-player state (resources, housing, summary, selection).
   * Keyed by playerNumber so receiver can restore each player independently.
   */
  playerStates: Record<PlayerNumber, ProbableWafflePlayerStateData>;
  /** Research state keyed by playerNumber. */
  playerResearch?: Record<PlayerNumber, string[]>;
}

/**
 * Sent by a client that needs a catch-up snapshot (reconnect or late-join spectator).
 * The host responds with `ProbableWaffleSnapshotResponseEvent`.
 */
export interface ProbableWaffleSnapshotRequestEvent extends ProbableWaffleCommunicatorEvent {}

/** Host → requesting client: full simulation snapshot for catch-up. */
export interface ProbableWaffleSnapshotResponseEvent extends ProbableWaffleCommunicatorEvent {
  targetUserId: UserId;
  snapshot: ProbableWaffleSnapshotData;
}

/** Broadcast by the server when a player's socket drops unexpectedly. */
export interface ProbableWafflePlayerDisconnectedEvent extends ProbableWaffleCommunicatorEvent {
  playerNumber: PlayerNumber;
  /** Seconds remaining in the reconnect grace window. */
  reconnectWindowSeconds: number;
}

/** Broadcast by the server when a disconnected player rejoins within the grace window. */
export interface ProbableWafflePlayerReconnectedEvent extends ProbableWaffleCommunicatorEvent {
  playerNumber: PlayerNumber;
}

export interface ProbableWaffleWebsocketRoomEvent {
  gameInstanceId: GameInstanceId;
  type: "join" | "leave";
}

export enum ProbableWaffleGatewayEvent {
  ProbableWaffleRoom = "probable-waffle-room",
  ProbableWaffleAction = "probable-waffle-action",
  ProbableWaffleMessage = "probable-waffle-message",
  ProbableWaffleWebsocketRoom = "probable-waffle-websocket-room"
}

export interface AllScenesEventData {
  name:
    | "save-game"
    | "restart-game"
    | "selection.deselect"
    | "selection.singleSelect"
    | "selection.doubleSelect"
    | "selection.multiSelect"
    | "selection.multiSelectPreview"
    | "selection.terrainSelect"
    | "quit"
    | "chat-message-received"
    | "external-modal-opened"
    | "external-modal-closed"
    | "hud-scene-shutdown"
    | "desync-detected";
  data?: any;
}
