import type { ChatMessage } from "../../chat/chat";
import type { ProbableWaffleGameInstanceMetadataData } from "../../game-instance/probable-waffle/game-instance-medatada";
import type { ProbableWaffleGameModeData } from "../../game-instance/probable-waffle/game-mode";
import type { CommunicatorEvent } from "../communicator";
import {
  ProbableWafflePlayer,
  type ProbableWafflePlayerControllerData,
  type ProbableWafflePlayerStateData
} from "../../game-instance/probable-waffle/player";
import type { ProbableWaffleSpectatorData } from "../../game-instance/probable-waffle/spectator";
import type { ActorDefinition, ProbableWaffleGameStateData } from "../../game-instance/probable-waffle/game-state";
import type { GameCommand } from "../../game-instance/probable-waffle/game-command";
import type { GameInstanceId, PlayerNumber, UserId } from "../../game-instance/player/player";
import type { SelectionGroupData } from "../../game-instance/probable-waffle/component-data";
import type { ProbableWaffleGameInstanceData } from "../../game-instance/probable-waffle/game-instance";
import type { ProbableWaffleDoubleSelectionData, ProbableWaffleSelectionData } from "./communicator-game-events";

export const ProbableWaffleGameCommunicatorTypes = {
  Selection: "selection"
} as const;

export const ProbableWaffleCommunicators = {
  GameInstanceMetadataDataChange: "gameInstanceMetadataDataChange",
  GameModeDataChange: "gameModeDataChange",
  PlayerDataChange: "playerDataChange",
  SpectatorDataChange: "spectatorDataChange",
  GameStateDataChange: "gameStateDataChange",
  Message: "message",
  GameCommand: "game-command",
  StateHash: "state-hash",
  SnapshotRequest: "snapshot-request",
  SnapshotResponse: "snapshot-response",
  InstanceReseedRequired: "instance-reseed-required",
  InstanceReseed: "instance-reseed",
  DesyncAlert: "desync-alert",
  PauseChanged: "pause-changed",
  PlayerDisconnected: "player-disconnected",
  PlayerReconnected: "player-reconnected",
  HostMigrated: "host-migrated",
  Selection: ProbableWaffleGameCommunicatorTypes.Selection
} as const;

export type ProbableWaffleCommunicatorType =
  (typeof ProbableWaffleCommunicators)[keyof typeof ProbableWaffleCommunicators];

export interface ProbableWaffleCommunicatorEvent {
  gameInstanceId: GameInstanceId;
  emitterUserId: UserId | null;
}

export type RecursiveKeyOf<TObj extends object> = {
  [TKey in keyof TObj & (string | number)]: TObj[TKey] extends unknown[]
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
  Exclude<keyof TObj, keyof Map<unknown, unknown>>];

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

export const ProbableWafflePlayerDataChangeProperties = {
  Joined: "joined",
  Left: "left",
  JoinedFromNetwork: "joinedFromNetwork",
  LeftOrKilledChanged: "playerController.data.leftOrKilled",
  SelectionAdded: "selection.added",
  SelectionRemoved: "selection.removed",
  SelectionSet: "selection.set",
  SelectionCleared: "selection.cleared",
  ResourceAdded: "resource.added",
  ResourceRemoved: "resource.removed",
  HousingAdded: "housing.added",
  HousingRemoved: "housing.removed",
  HousingCurrentIncreased: "housing.current.increased",
  HousingCurrentDecreased: "housing.current.decreased",
  PlayerSceneReady: "player.scene-ready",
  CommandIssuedMove: "command.issued.move",
  CommandIssuedActor: "command.issued.actor",
  SelectionGroupsChanged: "playerController.data.selectionGroups"
} as const;

export type ProbableWafflePlayerDataChangeEventPayload = Partial<{
  // provide player number only when updating player
  playerNumber?: PlayerNumber;
  playerStateData: Partial<ProbableWafflePlayerStateData>;
  playerControllerData: Partial<ProbableWafflePlayerControllerData>;
  data: Record<string, unknown>;
}>;

export type ProbableWafflePlayerDataChangeEventProperty =
  | ProbableWaffleDataChangeEventProperty<ProbableWafflePlayer>
  | typeof ProbableWafflePlayerDataChangeProperties.Joined
  | typeof ProbableWafflePlayerDataChangeProperties.Left
  | typeof ProbableWafflePlayerDataChangeProperties.JoinedFromNetwork
  | typeof ProbableWafflePlayerDataChangeProperties.LeftOrKilledChanged
  | typeof ProbableWafflePlayerDataChangeProperties.SelectionAdded
  | typeof ProbableWafflePlayerDataChangeProperties.SelectionRemoved
  | typeof ProbableWafflePlayerDataChangeProperties.SelectionSet
  | typeof ProbableWafflePlayerDataChangeProperties.SelectionCleared
  | typeof ProbableWafflePlayerDataChangeProperties.ResourceAdded
  | typeof ProbableWafflePlayerDataChangeProperties.ResourceRemoved
  | typeof ProbableWafflePlayerDataChangeProperties.HousingAdded
  | typeof ProbableWafflePlayerDataChangeProperties.HousingRemoved
  | typeof ProbableWafflePlayerDataChangeProperties.HousingCurrentIncreased
  | typeof ProbableWafflePlayerDataChangeProperties.HousingCurrentDecreased
  | typeof ProbableWafflePlayerDataChangeProperties.PlayerSceneReady
  // Legacy command properties are still consumed by existing listeners and backend validation.
  // New lockstep multiplayer commands should use ProbableWaffleGameCommandEvent instead.
  | typeof ProbableWafflePlayerDataChangeProperties.CommandIssuedMove
  | typeof ProbableWafflePlayerDataChangeProperties.CommandIssuedActor;
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

export interface ProbableWaffleGameCommandTransportMeta {
  /**
   * Monotonic sequence assigned by the sending client. This lets us prove
   * whether command packets were emitted, relayed, or received out of order.
   */
  clientSequence: number;
  /** Wall-clock timestamp captured on the sending client for diagnostics only. */
  clientSentAtWallTimeMs: number;
  /** Simulation tick the sender was executing when it emitted this packet. */
  clientObservedTick: number;
  /** Highest authoritative local tick the sender had already seen echoed back. */
  clientAcknowledgedLocalTick: number;
  /** Which command-bus path emitted the packet. */
  clientSource: "startup-seed" | "steady-state-tick" | "snapshot-reset";
  /** Monotonic relay sequence assigned by the API per (game, player) stream. */
  serverRelaySequence?: number;
  /** Wall-clock timestamp captured by the API when it received/relayed the packet. */
  serverReceivedAtWallTimeMs?: number;
}

/**
 * Carries one player's committed command batch for a given simulation tick.
 * Sent by every player on every tick (even if commands is empty) so peers can
 * advance the lockstep barrier.
 */
export interface ProbableWaffleGameCommandEvent extends ProbableWaffleCommunicatorEvent {
  /** The simulation tick on which these commands should execute. */
  tick: number;
  playerNumber: PlayerNumber;
  /** Serialised GameCommand objects. */
  commands: GameCommand[];
  /** Optional transport diagnostics for ordering and jitter investigation. */
  transportMeta?: ProbableWaffleGameCommandTransportMeta;
  /**
   * Set by the server when a batch is rejected due to payload validation.
   * The batch is still relayed as empty (commands: []) so the lockstep barrier
   * can advance; the reason is logged on the sending client as a warning.
   * Absent on valid relays.
   */
  rejectionReason?: string;
}

/** Periodic state-hash snapshot. Each client broadcasts its own hash; peers compare. */
export interface ProbableWaffleStateHashDiagnostics {
  actorDigests?: Record<string, string>;
  playerDigests?: string[];
  researchDigest?: string;
}

export interface ProbableWaffleStateHashEvent extends ProbableWaffleCommunicatorEvent {
  /** The simulation tick at which this hash was computed. */
  tick: number;
  playerNumber: PlayerNumber;
  /** djb2 hex hash of all actor states sorted by actor ID. */
  hash: string;
  diagnostics?: ProbableWaffleStateHashDiagnostics;
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
  /** Player-local control group state keyed by playerNumber. */
  playerSelectionGroups?: Record<PlayerNumber, SelectionGroupData[]>;
  /** Research state keyed by playerNumber. */
  playerResearch?: Record<PlayerNumber, string[]>;
}

/**
 * Sent by a client that needs a catch-up snapshot (reconnect or late-join spectator).
 * The host responds with `ProbableWaffleSnapshotResponseEvent`.
 */
export interface ProbableWaffleSnapshotRequestEvent extends ProbableWaffleCommunicatorEvent {
  reason?: "reconnect" | "spectator-catch-up" | "desync-correction";
}

/** Host → requesting client: full simulation snapshot for catch-up. */
export interface ProbableWaffleSnapshotResponseEvent extends ProbableWaffleCommunicatorEvent {
  targetUserId: UserId;
  snapshot: ProbableWaffleSnapshotData;
  /** Why this snapshot was pushed to the client. */
  reason?: "reconnect" | "spectator-catch-up" | "desync-correction";
  /**
   * Short rolling tail of command batches committed after snapshot.tick.
   * This closes the race between host snapshot capture and the reconnecting
   * client's next live tick without pretending we can offline fast-forward the
   * whole sim outside the normal Phaser update path.
   */
  commandTail?: ProbableWaffleGameCommandEvent[];
}

/**
 * Server → client: indicates the authoritative in-memory game instance is missing
 * (for example after backend restart) and a client should reseed it.
 */
export interface ProbableWaffleInstanceReseedRequiredEvent extends ProbableWaffleCommunicatorEvent {
  reason: "missing-game-instance";
}

/** Client → server: full in-memory game instance payload used to recreate missing match state. */
export interface ProbableWaffleInstanceReseedEvent extends ProbableWaffleCommunicatorEvent {
  gameInstanceData: ProbableWaffleGameInstanceData;
}

/** Broadcast by the host when a correction attempt failed and room-wide recovery must start. */
export interface ProbableWaffleDesyncAlertEvent extends ProbableWaffleCommunicatorEvent {
  tick: number;
  desyncedPlayerNumber: PlayerNumber;
  reason?: string;
}

/** Player-issued pause or resume request relayed to the whole room. */
export interface ProbableWafflePauseChangedEvent extends ProbableWaffleCommunicatorEvent {
  playerNumber: PlayerNumber;
  paused: boolean;
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

/** Broadcast by the server when host duties move to another player. */
export interface ProbableWaffleHostMigratedEvent extends ProbableWaffleCommunicatorEvent {
  previousHostUserId: UserId | null;
  currentHostUserId: UserId;
  currentHostPlayerNumber: PlayerNumber;
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

export type AllScenesEventData =
  | { name: "chat-message-received"; data: ChatMessage }
  | { name: "selection.singleSelect"; data: ProbableWaffleSelectionData }
  | { name: "selection.doubleSelect"; data: ProbableWaffleDoubleSelectionData }
  | { name: "selection.multiSelect"; data: ProbableWaffleSelectionData }
  | { name: "selection.multiSelectPreview"; data: ProbableWaffleSelectionData }
  | { name: "selection.terrainSelect"; data: ProbableWaffleSelectionData }
  | {
      name:
        | "save-game"
        | "restart-game"
        | "selection.deselect"
        | "quit"
        | "external-modal-opened"
        | "external-modal-closed"
        | "hud-scene-shutdown"
        | "desync-detected"
        | "pause-toggle-requested";
      data?: undefined;
    };

export interface ProbableWaffleCommunicatorPayloadByType {
  [ProbableWaffleCommunicators.GameInstanceMetadataDataChange]: ProbableWaffleGameInstanceMetadataChangeEvent;
  [ProbableWaffleCommunicators.GameModeDataChange]: ProbableWaffleGameModeDataChangeEvent;
  [ProbableWaffleCommunicators.PlayerDataChange]: ProbableWafflePlayerDataChangeEvent;
  [ProbableWaffleCommunicators.SpectatorDataChange]: ProbableWaffleSpectatorDataChangeEvent;
  [ProbableWaffleCommunicators.GameStateDataChange]: ProbableWaffleGameStateDataChangeEvent;
  [ProbableWaffleCommunicators.Message]: ProbableWaffleCommunicatorMessageEvent;
  [ProbableWaffleCommunicators.GameCommand]: ProbableWaffleGameCommandEvent;
  [ProbableWaffleCommunicators.StateHash]: ProbableWaffleStateHashEvent;
  [ProbableWaffleCommunicators.SnapshotRequest]: ProbableWaffleSnapshotRequestEvent;
  [ProbableWaffleCommunicators.SnapshotResponse]: ProbableWaffleSnapshotResponseEvent;
  [ProbableWaffleCommunicators.InstanceReseedRequired]: ProbableWaffleInstanceReseedRequiredEvent;
  [ProbableWaffleCommunicators.InstanceReseed]: ProbableWaffleInstanceReseedEvent;
  [ProbableWaffleCommunicators.DesyncAlert]: ProbableWaffleDesyncAlertEvent;
  [ProbableWaffleCommunicators.PauseChanged]: ProbableWafflePauseChangedEvent;
  [ProbableWaffleCommunicators.PlayerDisconnected]: ProbableWafflePlayerDisconnectedEvent;
  [ProbableWaffleCommunicators.PlayerReconnected]: ProbableWafflePlayerReconnectedEvent;
  [ProbableWaffleCommunicators.HostMigrated]: ProbableWaffleHostMigratedEvent;
  [ProbableWaffleCommunicators.Selection]: unknown;
}

export type ProbableWaffleCommunicatorEventByType<T extends ProbableWaffleCommunicatorType> = CommunicatorEvent<
  ProbableWaffleCommunicatorPayloadByType[T],
  T
>;

export type ProbableWaffleCommunicatorEventUnion = {
  [T in ProbableWaffleCommunicatorType]: ProbableWaffleCommunicatorEventByType<T>;
}[ProbableWaffleCommunicatorType];
