import type { ChatMessage } from "@fuzzy-waddle/platform-chat";
import type { ProbableWaffleGameInstanceMetadataData } from "../../game-instance/probable-waffle/game-instance-medatada";
import type { ProbableWaffleGameModeData } from "../../game-instance/probable-waffle/game-mode";
import type { CommunicatorEvent } from "@fuzzy-waddle/platform-game-sessions";
import {
  ProbableWafflePlayer,
  type ProbableWafflePlayerControllerData,
  type ProbableWafflePlayerStateData
} from "../../game-instance/probable-waffle/player";
import type { ProbableWaffleSpectatorData } from "../../game-instance/probable-waffle/spectator";
import type { ActorDefinition, ProbableWaffleGameStateData } from "../../game-instance/probable-waffle/game-state";
import type { GameCommand } from "../../game-instance/probable-waffle/game-command";
import type { GameInstanceId, PlayerNumber, UserId, Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { SelectionGroupData } from "../../game-instance/probable-waffle/component-data";
import type { ProbableWaffleGameInstanceData } from "../../game-instance/probable-waffle/game-instance";
import type { ProbableWaffleDoubleSelectionData, ProbableWaffleSelectionData } from "./communicator-game-events";
import type { CampaignMissionRuntimeState } from "../../probable-waffle/campaign-runtime";

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
  MinimapSignal: "minimap-signal",
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

/**
 * Defines the probable waffle communicator type alias used by this module. Keep values in this named domain so
 * linked APIs and storage boundaries do not drift into an unconstrained primitive.
 */
export type ProbableWaffleCommunicatorType =
  (typeof ProbableWaffleCommunicators)[keyof typeof ProbableWaffleCommunicators];

/**
 * Defines the structured probable waffle communicator event contract for this module. Its declared surface
 * makes game instance id, emitter user id explicit to every consumer. Use this shared shape rather than an
 * ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface ProbableWaffleCommunicatorEvent {
  /**
   * stable game instance id used by {@link ProbableWaffleCommunicatorEvent} to correlate this value with related
   * records, events, or authored content; it is not a display label.
   */
  gameInstanceId: GameInstanceId;
  /**
   * stable emitter user id used by {@link ProbableWaffleCommunicatorEvent} to correlate this value with related
   * records, events, or authored content; it is not a display label.
   */
  emitterUserId: UserId | null;
}

/**
 * Defines the recursive key of alias used by this module. Keep values in this named domain so linked APIs and
 * storage boundaries do not drift into an unconstrained primitive.
 */
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

/**
 * Defines the probable waffle all changed alias used by this module. Keep values in this named domain so
 * linked APIs and storage boundaries do not drift into an unconstrained primitive.
 */
export type ProbableWaffleAllChanged = "all";

/**
 * Defines the closed probable waffle data change event property value set. Keeping this union named preserves
 * exhaustive handling and prevents incompatible free-form values at its boundaries.
 */
export type ProbableWaffleDataChangeEventProperty<T extends object> = RecursiveKeyOf<T> | ProbableWaffleAllChanged;

/**
 * Defines the structured probable waffle game instance metadata change event contract for this module. Its
 * declared surface makes property, data explicit to every consumer. Use this shared shape rather than an
 * ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface ProbableWaffleGameInstanceMetadataChangeEvent extends ProbableWaffleCommunicatorEvent {
  /**
   * property value carried by {@link ProbableWaffleGameInstanceMetadataChangeEvent}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  property: ProbableWaffleDataChangeEventProperty<ProbableWaffleGameInstanceMetadataData>;
  /**
   * typed data associated with {@link ProbableWaffleGameInstanceMetadataChangeEvent}. Preserve its declared
   * contract at serialization and adapter boundaries instead of weakening it to an unstructured record.
   */
  data: Partial<ProbableWaffleGameInstanceMetadataData>;
}

/**
 * Defines the structured probable waffle game mode data change event contract for this module. Its declared
 * surface makes property, data explicit to every consumer. Use this shared shape rather than an ad-hoc object
 * so adapters, persistence, and callers remain compatible.
 */
export interface ProbableWaffleGameModeDataChangeEvent extends ProbableWaffleCommunicatorEvent {
  /**
   * property value carried by {@link ProbableWaffleGameModeDataChangeEvent}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  property: ProbableWaffleDataChangeEventProperty<ProbableWaffleGameModeData>;
  /**
   * typed data associated with {@link ProbableWaffleGameModeDataChangeEvent}. Preserve its declared contract at
   * serialization and adapter boundaries instead of weakening it to an unstructured record.
   */
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

/**
 * Defines the probable waffle player data change event payload alias used by this module. Keep values in this
 * named domain so linked APIs and storage boundaries do not drift into an unconstrained primitive.
 */
export type ProbableWafflePlayerDataChangeEventPayload = Partial<{
  // provide player number only when updating player
  playerNumber?: PlayerNumber;
  // Sent when a human claims a lobby slot so every client can render the same player identity.
  playerName?: string;
  playerStateData: Partial<ProbableWafflePlayerStateData>;
  playerControllerData: Partial<ProbableWafflePlayerControllerData>;
  data: Record<string, unknown>;
}>;

/**
 * Defines the closed probable waffle player data change event property value set. Keeping this union named
 * preserves exhaustive handling and prevents incompatible free-form values at its boundaries.
 */
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
/**
 * Defines the structured probable waffle player data change event contract for this module. Its declared
 * surface makes property, data explicit to every consumer. Use this shared shape rather than an ad-hoc object
 * so adapters, persistence, and callers remain compatible.
 */
export interface ProbableWafflePlayerDataChangeEvent extends ProbableWaffleCommunicatorEvent {
  /**
   * property value carried by {@link ProbableWafflePlayerDataChangeEvent}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  property: ProbableWafflePlayerDataChangeEventProperty;
  /**
   * typed data associated with {@link ProbableWafflePlayerDataChangeEvent}. Preserve its declared contract at
   * serialization and adapter boundaries instead of weakening it to an unstructured record.
   */
  data: ProbableWafflePlayerDataChangeEventPayload;
}

/**
 * Defines the closed probable waffle spectator data change event property value set. Keeping this union named
 * preserves exhaustive handling and prevents incompatible free-form values at its boundaries.
 */
export type ProbableWaffleSpectatorDataChangeEventProperty =
  | ProbableWaffleDataChangeEventProperty<ProbableWaffleSpectatorData>
  | "joined"
  | "left";
/**
 * Defines the structured probable waffle spectator data change event contract for this module. Its declared
 * surface makes property, data explicit to every consumer. Use this shared shape rather than an ad-hoc object
 * so adapters, persistence, and callers remain compatible.
 */
export interface ProbableWaffleSpectatorDataChangeEvent extends ProbableWaffleCommunicatorEvent {
  /**
   * property value carried by {@link ProbableWaffleSpectatorDataChangeEvent}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  property: ProbableWaffleSpectatorDataChangeEventProperty;
  /**
   * typed data associated with {@link ProbableWaffleSpectatorDataChangeEvent}. Preserve its declared contract at
   * serialization and adapter boundaries instead of weakening it to an unstructured record.
   */
  data: Partial<ProbableWaffleSpectatorData>;
}

/**
 * Defines the closed probable waffle game state data change event property value set. Keeping this union named
 * preserves exhaustive handling and prevents incompatible free-form values at its boundaries.
 */
export type ProbableWaffleGameStateDataChangeEventProperty =
  | ProbableWaffleDataChangeEventProperty<ProbableWaffleGameStateData>
  | RecursiveKeyOf<ActorDefinition>;

/**
 * Defines the probable waffle game state data payload alias used by this module. Keep values in this named
 * domain so linked APIs and storage boundaries do not drift into an unconstrained primitive.
 */
export type ProbableWaffleGameStateDataPayload = Partial<{
  actorDefinition: Partial<
    {
      id: string;
    } & Partial<ActorDefinition>
  >;
  gameState: Partial<ProbableWaffleGameStateData>;
}>;

/**
 * Defines the structured probable waffle game state data change event contract for this module. Its declared
 * surface makes property, data explicit to every consumer. Use this shared shape rather than an ad-hoc object
 * so adapters, persistence, and callers remain compatible.
 */
export interface ProbableWaffleGameStateDataChangeEvent extends ProbableWaffleCommunicatorEvent {
  /**
   * property value carried by {@link ProbableWaffleGameStateDataChangeEvent}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  property: ProbableWaffleGameStateDataChangeEventProperty;
  /**
   * typed data associated with {@link ProbableWaffleGameStateDataChangeEvent}. Preserve its declared contract at
   * serialization and adapter boundaries instead of weakening it to an unstructured record.
   */
  data: ProbableWaffleGameStateDataPayload;
}

/**
 * Defines the structured probable waffle communicator message event contract for this module. Its declared
 * surface makes chat message explicit to every consumer. Use this shared shape rather than an ad-hoc object so
 * adapters, persistence, and callers remain compatible.
 */
export interface ProbableWaffleCommunicatorMessageEvent extends ProbableWaffleCommunicatorEvent {
  /**
   * chat message value carried by {@link ProbableWaffleCommunicatorMessageEvent}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  chatMessage: ChatMessage;
}

/**
 * Transient teammate-facing location signal.
 *
 * Unlike a lockstep command, this event never changes simulation state, save
 * data, or replay data. The server validates the claimed player and tile then
 * relays it only to active human teammates.
 */
export interface ProbableWaffleMinimapSignalEvent extends ProbableWaffleCommunicatorEvent {
  /** Player that authored the signal; the server verifies ownership against the authenticated socket user. */
  playerNumber: PlayerNumber;
  /** Integer tile coordinate shared by minimap and world presenters. */
  tile: Vector2Simple;
}

/**
 * Defines the structured probable waffle game command transport meta contract for this module. Its declared
 * surface makes client sequence, client sent at wall time ms, client observed tick, client acknowledged local
 * tick, client source explicit to every consumer. Use this shared shape rather than an ad-hoc object so
 * adapters, persistence, and callers remain compatible.
 */
export interface ProbableWaffleGameCommandTransportMeta {
  /**
   * Monotonic sequence assigned by the sending client. This lets us prove
   * whether command packets were emitted, relayed, or received out of order.
   */
  clientSequence: number;
  /** Documents the client sent at wall time ms member and its declared contract at this boundary. */
  clientSentAtWallTimeMs: number;
  /** Documents the client observed tick member and its declared contract at this boundary. */
  clientObservedTick: number;
  /** Documents the client acknowledged local tick member and its declared contract at this boundary. */
  clientAcknowledgedLocalTick: number;
  /** Documents the client source member and its declared contract at this boundary. */
  clientSource: "startup-seed" | "steady-state-tick" | "snapshot-reset";
  /** Documents the server relay sequence member and its declared contract at this boundary. */
  serverRelaySequence?: number;
  /** Documents the server received at wall time ms member and its declared contract at this boundary. */
  serverReceivedAtWallTimeMs?: number;
}

/**
 * Carries one player's committed command batch for a given simulation tick.
 * Sent by every player on every tick (even if commands is empty) so peers can
 * advance the lockstep barrier.
 */
export interface ProbableWaffleGameCommandEvent extends ProbableWaffleCommunicatorEvent {
  /** Documents the tick member and its declared contract at this boundary. */
  tick: number;
  /**
   * player number value carried by {@link ProbableWaffleGameCommandEvent}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  playerNumber: PlayerNumber;
  /** Documents the commands member and its declared contract at this boundary. */
  commands: GameCommand[];
  /** Documents the transport meta member and its declared contract at this boundary. */
  transportMeta?: ProbableWaffleGameCommandTransportMeta;
  /**
   * Set by the server when a batch is rejected due to payload validation.
   * The batch is still relayed as empty (commands: []) so the lockstep barrier
   * can advance; the reason is logged on the sending client as a warning.
   * Absent on valid relays.
   */
  rejectionReason?: string;
}

/** Defines the probable waffle state hash diagnostics contract used by this module; its declared members form the compatible boundary for linked consumers. */
export interface ProbableWaffleStateHashDiagnostics {
  /**
   * Optional keyed/nested actor digests structure owned by {@link ProbableWaffleStateHashDiagnostics}. Keep its
   * keys and value contract explicit so callers cannot smuggle a broader shape across this boundary.
   */
  actorDigests?: Record<string, string>;
  /**
   * Optional collection value on {@link ProbableWaffleStateHashDiagnostics}. Its element type defines the
   * records that may cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on
   * it.
   */
  playerDigests?: string[];
  /**
   * Optional string research digest carried by {@link ProbableWaffleStateHashDiagnostics}. Treat it according to
   * the owning contract’s validation and presentation rules rather than assuming it is a stable identifier.
   */
  researchDigest?: string;
  /**
   * Optional string campaign mission digest carried by {@link ProbableWaffleStateHashDiagnostics}. Treat it
   * according to the owning contract’s validation and presentation rules rather than assuming it is a stable
   * identifier.
   */
  campaignMissionDigest?: string;
  /**
   * Optional keyed/nested campaign mission family digests structure owned by {@link
   * ProbableWaffleStateHashDiagnostics}. Keep its keys and value contract explicit so callers cannot smuggle a
   * broader shape across this boundary.
   */
  campaignMissionFamilyDigests?: Record<string, string>;
  /**
   * Optional string random digest carried by {@link ProbableWaffleStateHashDiagnostics}. Treat it according to
   * the owning contract’s validation and presentation rules rather than assuming it is a stable identifier.
   */
  randomDigest?: string;
}

/**
 * Defines the structured probable waffle state hash event contract for this module. Its declared surface makes
 * tick, player number, hash, diagnostics explicit to every consumer. Use this shared shape rather than an
 * ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface ProbableWaffleStateHashEvent extends ProbableWaffleCommunicatorEvent {
  /** Documents the tick member and its declared contract at this boundary. */
  tick: number;
  /**
   * player number value carried by {@link ProbableWaffleStateHashEvent}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  playerNumber: PlayerNumber;
  /** Documents the hash member and its declared contract at this boundary. */
  hash: string;
  /**
   * Optional diagnostics value carried by {@link ProbableWaffleStateHashEvent}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  diagnostics?: ProbableWaffleStateHashDiagnostics;
}

/** Defines the probable waffle snapshot data contract used by this module; its declared members form the compatible boundary for linked consumers. */
export interface ProbableWaffleSnapshotData {
  /** Documents the tick member and its declared contract at this boundary. */
  tick: number;
  /** Documents the actors member and its declared contract at this boundary. */
  actors: ActorDefinition[];
  /**
   * Per-player state (resources, housing, summary, selection).
   * Keyed by playerNumber so receiver can restore each player independently.
   */
  playerStates: Record<PlayerNumber, ProbableWafflePlayerStateData>;
  /** Documents the player selection groups member and its declared contract at this boundary. */
  playerSelectionGroups?: Record<PlayerNumber, SelectionGroupData[]>;
  /** Documents the player research member and its declared contract at this boundary. */
  playerResearch?: Record<PlayerNumber, string[]>;
  /** Documents the campaign mission member and its declared contract at this boundary. */
  campaignMission?: CampaignMissionRuntimeState;
  /** Documents the random state member and its declared contract at this boundary. */
  randomState?: import("../../probable-waffle/deterministic-random").DeterministicRandomState;
}

/**
 * Sent by a client that needs a catch-up snapshot (reconnect or late-join spectator).
 * The host responds with `ProbableWaffleSnapshotResponseEvent`.
 */
export interface ProbableWaffleSnapshotRequestEvent extends ProbableWaffleCommunicatorEvent {
  /**
   * Optional reason value carried by {@link ProbableWaffleSnapshotRequestEvent}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  reason?: "reconnect" | "spectator-catch-up" | "desync-correction";
}

/** Defines the probable waffle snapshot response event contract used by this module; its declared members form the compatible boundary for linked consumers. */
export interface ProbableWaffleSnapshotResponseEvent extends ProbableWaffleCommunicatorEvent {
  /**
   * stable target user id used by {@link ProbableWaffleSnapshotResponseEvent} to correlate this value with
   * related records, events, or authored content; it is not a display label.
   */
  targetUserId: UserId;
  /**
   * snapshot value carried by {@link ProbableWaffleSnapshotResponseEvent}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  snapshot: ProbableWaffleSnapshotData;
  /** Documents the reason member and its declared contract at this boundary. */
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
  /**
   * reason value carried by {@link ProbableWaffleInstanceReseedRequiredEvent}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  reason: "missing-game-instance";
}

/** Defines the probable waffle instance reseed event contract used by this module; its declared members form the compatible boundary for linked consumers. */
export interface ProbableWaffleInstanceReseedEvent extends ProbableWaffleCommunicatorEvent {
  /**
   * game instance data value carried by {@link ProbableWaffleInstanceReseedEvent}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  gameInstanceData: ProbableWaffleGameInstanceData;
}

/** Defines the probable waffle desync alert event contract used by this module; its declared members form the compatible boundary for linked consumers. */
export interface ProbableWaffleDesyncAlertEvent extends ProbableWaffleCommunicatorEvent {
  /**
   * temporal value for {@link ProbableWaffleDesyncAlertEvent}. It anchors ordering, expiry, or presentation
   * timing and must use the time domain declared by the enclosing contract.
   */
  tick: number;
  /**
   * desynced player number value carried by {@link ProbableWaffleDesyncAlertEvent}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  desyncedPlayerNumber: PlayerNumber;
  /**
   * Optional string reason carried by {@link ProbableWaffleDesyncAlertEvent}. Treat it according to the owning
   * contract’s validation and presentation rules rather than assuming it is a stable identifier.
   */
  reason?: string;
}

/** Defines the probable waffle pause changed event contract used by this module; its declared members form the compatible boundary for linked consumers. */
export interface ProbableWafflePauseChangedEvent extends ProbableWaffleCommunicatorEvent {
  /**
   * player number value carried by {@link ProbableWafflePauseChangedEvent}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  playerNumber: PlayerNumber;
  /**
   * paused value carried by {@link ProbableWafflePauseChangedEvent}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  paused: boolean;
}

/** Defines the probable waffle player disconnected event contract used by this module; its declared members form the compatible boundary for linked consumers. */
export interface ProbableWafflePlayerDisconnectedEvent extends ProbableWaffleCommunicatorEvent {
  /**
   * player number value carried by {@link ProbableWafflePlayerDisconnectedEvent}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  playerNumber: PlayerNumber;
  /** Documents the reconnect window seconds member and its declared contract at this boundary. */
  reconnectWindowSeconds: number;
}

/** Defines the probable waffle player reconnected event contract used by this module; its declared members form the compatible boundary for linked consumers. */
export interface ProbableWafflePlayerReconnectedEvent extends ProbableWaffleCommunicatorEvent {
  /**
   * player number value carried by {@link ProbableWafflePlayerReconnectedEvent}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  playerNumber: PlayerNumber;
}

/** Defines the probable waffle host migrated event contract used by this module; its declared members form the compatible boundary for linked consumers. */
export interface ProbableWaffleHostMigratedEvent extends ProbableWaffleCommunicatorEvent {
  /**
   * stable previous host user id used by {@link ProbableWaffleHostMigratedEvent} to correlate this value with
   * related records, events, or authored content; it is not a display label.
   */
  previousHostUserId: UserId | null;
  /**
   * stable current host user id used by {@link ProbableWaffleHostMigratedEvent} to correlate this value with
   * related records, events, or authored content; it is not a display label.
   */
  currentHostUserId: UserId;
  /**
   * current host player number value carried by {@link ProbableWaffleHostMigratedEvent}. Its declared type is
   * the compatibility boundary for producers, validators, and consumers; do not replace it with a broader
   * inferred shape.
   */
  currentHostPlayerNumber: PlayerNumber;
}

/**
 * Defines the structured probable waffle websocket room event contract for this module. Its declared surface
 * makes game instance id, type explicit to every consumer. Use this shared shape rather than an ad-hoc object
 * so adapters, persistence, and callers remain compatible.
 */
export interface ProbableWaffleWebsocketRoomEvent {
  /**
   * stable game instance id used by {@link ProbableWaffleWebsocketRoomEvent} to correlate this value with
   * related records, events, or authored content; it is not a display label.
   */
  gameInstanceId: GameInstanceId;
  /**
   * discriminator for {@link ProbableWaffleWebsocketRoomEvent}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  type: "join" | "leave";
}

/**
 * Defines the closed probable waffle gateway event classification. Use an explicit member rather than a
 * free-form string so branching, persistence, and diagnostics share the same vocabulary.
 */
export enum ProbableWaffleGatewayEvent {
  /**
   * Selects the `ProbableWaffleRoom` case of {@link ProbableWaffleGatewayEvent}. Use this explicit member when
   * the surrounding flow requires this distinct policy or state; never substitute a free-form string.
   */
  ProbableWaffleRoom = "probable-waffle-room",
  /**
   * Selects the `ProbableWaffleAction` case of {@link ProbableWaffleGatewayEvent}. Use this explicit member when
   * the surrounding flow requires this distinct policy or state; never substitute a free-form string.
   */
  ProbableWaffleAction = "probable-waffle-action",
  /**
   * Selects the `ProbableWaffleMessage` case of {@link ProbableWaffleGatewayEvent}. Use this explicit member
   * when the surrounding flow requires this distinct policy or state; never substitute a free-form string.
   */
  ProbableWaffleMessage = "probable-waffle-message",
  /**
   * Selects the `ProbableWaffleWebsocketRoom` case of {@link ProbableWaffleGatewayEvent}. Use this explicit
   * member when the surrounding flow requires this distinct policy or state; never substitute a free-form
   * string.
   */
  ProbableWaffleWebsocketRoom = "probable-waffle-websocket-room"
}

/**
 * Defines the closed all scenes event data value set. Keeping this union named preserves exhaustive handling
 * and prevents incompatible free-form values at its boundaries.
 */
export type AllScenesEventData =
  | { name: "save-game"; data?: { kind: "manual" | "autosave" | "quicksave"; checkpointId?: string } }
  | { name: "external-modal-pause-changed"; data: { paused: boolean } }
  | { name: "chat-message-received"; data: ChatMessage }
  | { name: "selection.singleSelect"; data: ProbableWaffleSelectionData }
  | { name: "selection.doubleSelect"; data: ProbableWaffleDoubleSelectionData }
  | { name: "selection.multiSelect"; data: ProbableWaffleSelectionData }
  | { name: "selection.multiSelectPreview"; data: ProbableWaffleSelectionData }
  | { name: "selection.terrainSelect"; data: ProbableWaffleSelectionData }
  | {
      name:
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

/**
 * Defines the structured probable waffle communicator payload by type contract for this module. Its declared
 * surface makes [probable waffle communicators.game instance metadata data change], [probable waffle
 * communicators.game mode data change], [probable waffle communicators.player data change], [probable waffle
 * communicators.spectator data change], [probable waffle communicators.game state data change] explicit to
 * every consumer. Use this shared shape rather than an ad-hoc object so adapters, persistence, and callers
 * remain compatible.
 */
export interface ProbableWaffleCommunicatorPayloadByType {
  /**
   * [probable waffle communicators.game instance metadata data change] value carried by {@link
   * ProbableWaffleCommunicatorPayloadByType}. Its declared type is the compatibility boundary for producers,
   * validators, and consumers; do not replace it with a broader inferred shape.
   */
  [ProbableWaffleCommunicators.GameInstanceMetadataDataChange]: ProbableWaffleGameInstanceMetadataChangeEvent;
  /**
   * [probable waffle communicators.game mode data change] value carried by {@link
   * ProbableWaffleCommunicatorPayloadByType}. Its declared type is the compatibility boundary for producers,
   * validators, and consumers; do not replace it with a broader inferred shape.
   */
  [ProbableWaffleCommunicators.GameModeDataChange]: ProbableWaffleGameModeDataChangeEvent;
  /**
   * [probable waffle communicators.player data change] value carried by {@link
   * ProbableWaffleCommunicatorPayloadByType}. Its declared type is the compatibility boundary for producers,
   * validators, and consumers; do not replace it with a broader inferred shape.
   */
  [ProbableWaffleCommunicators.PlayerDataChange]: ProbableWafflePlayerDataChangeEvent;
  /**
   * [probable waffle communicators.spectator data change] value carried by {@link
   * ProbableWaffleCommunicatorPayloadByType}. Its declared type is the compatibility boundary for producers,
   * validators, and consumers; do not replace it with a broader inferred shape.
   */
  [ProbableWaffleCommunicators.SpectatorDataChange]: ProbableWaffleSpectatorDataChangeEvent;
  /**
   * [probable waffle communicators.game state data change] value carried by {@link
   * ProbableWaffleCommunicatorPayloadByType}. Its declared type is the compatibility boundary for producers,
   * validators, and consumers; do not replace it with a broader inferred shape.
   */
  [ProbableWaffleCommunicators.GameStateDataChange]: ProbableWaffleGameStateDataChangeEvent;
  /**
   * [probable waffle communicators.message] value carried by {@link ProbableWaffleCommunicatorPayloadByType}.
   * Its declared type is the compatibility boundary for producers, validators, and consumers; do not replace it
   * with a broader inferred shape.
   */
  [ProbableWaffleCommunicators.Message]: ProbableWaffleCommunicatorMessageEvent;
  /** Teammate-only transient minimap signal. */
  [ProbableWaffleCommunicators.MinimapSignal]: ProbableWaffleMinimapSignalEvent;
  /**
   * [probable waffle communicators.game command] value carried by {@link
   * ProbableWaffleCommunicatorPayloadByType}. Its declared type is the compatibility boundary for producers,
   * validators, and consumers; do not replace it with a broader inferred shape.
   */
  [ProbableWaffleCommunicators.GameCommand]: ProbableWaffleGameCommandEvent;
  /**
   * [probable waffle communicators.state hash] value carried by {@link ProbableWaffleCommunicatorPayloadByType}.
   * Its declared type is the compatibility boundary for producers, validators, and consumers; do not replace it
   * with a broader inferred shape.
   */
  [ProbableWaffleCommunicators.StateHash]: ProbableWaffleStateHashEvent;
  /**
   * [probable waffle communicators.snapshot request] value carried by {@link
   * ProbableWaffleCommunicatorPayloadByType}. Its declared type is the compatibility boundary for producers,
   * validators, and consumers; do not replace it with a broader inferred shape.
   */
  [ProbableWaffleCommunicators.SnapshotRequest]: ProbableWaffleSnapshotRequestEvent;
  /**
   * [probable waffle communicators.snapshot response] value carried by {@link
   * ProbableWaffleCommunicatorPayloadByType}. Its declared type is the compatibility boundary for producers,
   * validators, and consumers; do not replace it with a broader inferred shape.
   */
  [ProbableWaffleCommunicators.SnapshotResponse]: ProbableWaffleSnapshotResponseEvent;
  /**
   * [probable waffle communicators.instance reseed required] value carried by {@link
   * ProbableWaffleCommunicatorPayloadByType}. Its declared type is the compatibility boundary for producers,
   * validators, and consumers; do not replace it with a broader inferred shape.
   */
  [ProbableWaffleCommunicators.InstanceReseedRequired]: ProbableWaffleInstanceReseedRequiredEvent;
  /**
   * [probable waffle communicators.instance reseed] value carried by {@link
   * ProbableWaffleCommunicatorPayloadByType}. Its declared type is the compatibility boundary for producers,
   * validators, and consumers; do not replace it with a broader inferred shape.
   */
  [ProbableWaffleCommunicators.InstanceReseed]: ProbableWaffleInstanceReseedEvent;
  /**
   * [probable waffle communicators.desync alert] value carried by {@link
   * ProbableWaffleCommunicatorPayloadByType}. Its declared type is the compatibility boundary for producers,
   * validators, and consumers; do not replace it with a broader inferred shape.
   */
  [ProbableWaffleCommunicators.DesyncAlert]: ProbableWaffleDesyncAlertEvent;
  /**
   * [probable waffle communicators.pause changed] value carried by {@link
   * ProbableWaffleCommunicatorPayloadByType}. Its declared type is the compatibility boundary for producers,
   * validators, and consumers; do not replace it with a broader inferred shape.
   */
  [ProbableWaffleCommunicators.PauseChanged]: ProbableWafflePauseChangedEvent;
  /**
   * [probable waffle communicators.player disconnected] value carried by {@link
   * ProbableWaffleCommunicatorPayloadByType}. Its declared type is the compatibility boundary for producers,
   * validators, and consumers; do not replace it with a broader inferred shape.
   */
  [ProbableWaffleCommunicators.PlayerDisconnected]: ProbableWafflePlayerDisconnectedEvent;
  /**
   * [probable waffle communicators.player reconnected] value carried by {@link
   * ProbableWaffleCommunicatorPayloadByType}. Its declared type is the compatibility boundary for producers,
   * validators, and consumers; do not replace it with a broader inferred shape.
   */
  [ProbableWaffleCommunicators.PlayerReconnected]: ProbableWafflePlayerReconnectedEvent;
  /**
   * [probable waffle communicators.host migrated] value carried by {@link
   * ProbableWaffleCommunicatorPayloadByType}. Its declared type is the compatibility boundary for producers,
   * validators, and consumers; do not replace it with a broader inferred shape.
   */
  [ProbableWaffleCommunicators.HostMigrated]: ProbableWaffleHostMigratedEvent;
  /**
   * [probable waffle communicators.selection] value carried by {@link ProbableWaffleCommunicatorPayloadByType}.
   * Its declared type is the compatibility boundary for producers, validators, and consumers; do not replace it
   * with a broader inferred shape.
   */
  [ProbableWaffleCommunicators.Selection]: unknown;
}

/**
 * Defines the probable waffle communicator event by type alias used by this module. Keep values in this named
 * domain so linked APIs and storage boundaries do not drift into an unconstrained primitive.
 */
export type ProbableWaffleCommunicatorEventByType<T extends ProbableWaffleCommunicatorType> = CommunicatorEvent<
  ProbableWaffleCommunicatorPayloadByType[T],
  T
>;

/**
 * Defines the probable waffle communicator event union alias used by this module. Keep values in this named
 * domain so linked APIs and storage boundaries do not drift into an unconstrained primitive.
 */
export type ProbableWaffleCommunicatorEventUnion = {
  [T in ProbableWaffleCommunicatorType]: ProbableWaffleCommunicatorEventByType<T>;
}[ProbableWaffleCommunicatorType];
