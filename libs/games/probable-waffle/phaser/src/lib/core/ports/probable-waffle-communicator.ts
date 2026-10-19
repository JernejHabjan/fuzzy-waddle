import { TwoWayCommunicator } from "@fuzzy-waddle/platform-game-host/communicators/two-way-communicator";
import { type GameInstanceId } from "@fuzzy-waddle/platform-game-sessions";
import {
  type AllScenesEventData,
  type ProbableWaffleCommunicatorMessageEvent,
  type ProbableWaffleMinimapSignalEvent,
  type ProbableWaffleCommunicatorType,
  type ProbableWaffleDesyncAlertEvent,
  type ProbableWaffleGameCommandEvent,
  type ProbableWaffleGameInstanceMetadataChangeEvent,
  type ProbableWaffleGameModeDataChangeEvent,
  type ProbableWaffleGameStateDataChangeEvent,
  type ProbableWaffleHostMigratedEvent,
  type ProbableWaffleInstanceReseedEvent,
  type ProbableWaffleInstanceReseedRequiredEvent,
  type ProbableWafflePauseChangedEvent,
  type ProbableWafflePlayerDataChangeEvent,
  type ProbableWafflePlayerDisconnectedEvent,
  type ProbableWafflePlayerReconnectedEvent,
  type ProbableWaffleSnapshotRequestEvent,
  type ProbableWaffleSnapshotResponseEvent,
  type ProbableWaffleSpectatorDataChangeEvent,
  type ProbableWaffleStateHashEvent
} from "@fuzzy-waddle/probable-waffle-protocol";
import { Socket } from "ngx-socket-io";
import type { Observable, Subscription } from "rxjs";

/**
 * Defines the structured probable waffle local event bus contract for this module. Its declared surface makes
 * emit, subscribe, pipe explicit to every consumer. Use this shared shape rather than an ad-hoc object so
 * adapters, persistence, and callers remain compatible.
 */
export interface ProbableWaffleLocalEventBus<T> {
  /**
   * operation exposed by {@link ProbableWaffleLocalEventBus}. Its signature is the compatibility boundary for
   * implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  emit(value: T): void;
  /**
   * operation exposed by {@link ProbableWaffleLocalEventBus}. Its signature is the compatibility boundary for
   * implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  subscribe(observer: (value: T) => void): Subscription;
  /**
   * pipe value carried by {@link ProbableWaffleLocalEventBus}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  pipe: Observable<T>["pipe"];
}

/**
 * Defines the structural probable waffle utility event data contract. Its declared surface makes name, data
 * explicit to every consumer. This named alias keeps the boundary explicit without duplicating an anonymous
 * object shape.
 */
export type ProbableWaffleUtilityEventData = {
  /**
   * human-facing name for {@link ProbableWaffleUtilityEventData}. It supports UI, narration, or diagnostics and
   * must not be used as the stable identity of the record.
   */
  name: "save-game" | "save-game-rejected" | "campaign-restore-failed" | "load-game" | "settings" | "chat";
  /**
   * Optional typed data associated with {@link ProbableWaffleUtilityEventData}. Preserve its declared contract
   * at serialization and adapter boundaries instead of weakening it to an unstructured record.
   */
  data?: unknown;
};

/**
 * Defines the structured probable waffle communicator service interface contract for this module. Its declared
 * surface makes all scenes, utility events, game instance metadata changed, game mode changed, player changed
 * explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters, persistence, and
 * callers remain compatible.
 */
export interface ProbableWaffleCommunicatorServiceInterface {
  /**
   * all scenes value carried by {@link ProbableWaffleCommunicatorServiceInterface}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  allScenes: ProbableWaffleLocalEventBus<AllScenesEventData>;
  /**
   * collection owned by {@link ProbableWaffleCommunicatorServiceInterface}. Preserve the declared element
   * contract and any ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  utilityEvents: ProbableWaffleLocalEventBus<ProbableWaffleUtilityEventData>;
  /**
   * Optional game instance metadata changed value carried by {@link ProbableWaffleCommunicatorServiceInterface}.
   * Its declared type is the compatibility boundary for producers, validators, and consumers; do not replace it
   * with a broader inferred shape.
   */
  gameInstanceMetadataChanged?: TwoWayCommunicator<
    ProbableWaffleGameInstanceMetadataChangeEvent,
    ProbableWaffleCommunicatorType
  >;
  /**
   * Optional game mode changed value carried by {@link ProbableWaffleCommunicatorServiceInterface}. Its declared
   * type is the compatibility boundary for producers, validators, and consumers; do not replace it with a
   * broader inferred shape.
   */
  gameModeChanged?: TwoWayCommunicator<ProbableWaffleGameModeDataChangeEvent, ProbableWaffleCommunicatorType>;
  /**
   * Optional player changed value carried by {@link ProbableWaffleCommunicatorServiceInterface}. Its declared
   * type is the compatibility boundary for producers, validators, and consumers; do not replace it with a
   * broader inferred shape.
   */
  playerChanged?: TwoWayCommunicator<ProbableWafflePlayerDataChangeEvent, ProbableWaffleCommunicatorType>;
  /**
   * Optional spectator changed value carried by {@link ProbableWaffleCommunicatorServiceInterface}. Its declared
   * type is the compatibility boundary for producers, validators, and consumers; do not replace it with a
   * broader inferred shape.
   */
  spectatorChanged?: TwoWayCommunicator<ProbableWaffleSpectatorDataChangeEvent, ProbableWaffleCommunicatorType>;
  /**
   * Optional game state changed value carried by {@link ProbableWaffleCommunicatorServiceInterface}. Its
   * declared type is the compatibility boundary for producers, validators, and consumers; do not replace it with
   * a broader inferred shape.
   */
  gameStateChanged?: TwoWayCommunicator<ProbableWaffleGameStateDataChangeEvent, ProbableWaffleCommunicatorType>;
  /**
   * Optional message value carried by {@link ProbableWaffleCommunicatorServiceInterface}. Its declared type is
   * the compatibility boundary for producers, validators, and consumers; do not replace it with a broader
   * inferred shape.
   */
  message?: TwoWayCommunicator<ProbableWaffleCommunicatorMessageEvent, ProbableWaffleCommunicatorType>;
  /** Optional multiplayer transport for transient teammate-only minimap signals. */
  minimapSignal?: TwoWayCommunicator<ProbableWaffleMinimapSignalEvent, ProbableWaffleCommunicatorType>;
  /** Documents the game command changed member and its declared contract at this boundary. */
  gameCommandChanged?: TwoWayCommunicator<ProbableWaffleGameCommandEvent, ProbableWaffleCommunicatorType>;
  /** Documents the state hash changed member and its declared contract at this boundary. */
  stateHashChanged?: TwoWayCommunicator<ProbableWaffleStateHashEvent, ProbableWaffleCommunicatorType>;
  /** Documents the snapshot requested member and its declared contract at this boundary. */
  snapshotRequested?: TwoWayCommunicator<ProbableWaffleSnapshotRequestEvent, ProbableWaffleCommunicatorType>;
  /** Documents the snapshot response member and its declared contract at this boundary. */
  snapshotResponse?: TwoWayCommunicator<ProbableWaffleSnapshotResponseEvent, ProbableWaffleCommunicatorType>;
  /** Documents the instance reseed required member and its declared contract at this boundary. */
  instanceReseedRequired?: TwoWayCommunicator<
    ProbableWaffleInstanceReseedRequiredEvent,
    ProbableWaffleCommunicatorType
  >;
  /** Documents the instance reseed member and its declared contract at this boundary. */
  instanceReseed?: TwoWayCommunicator<ProbableWaffleInstanceReseedEvent, ProbableWaffleCommunicatorType>;
  /** Documents the desync alert member and its declared contract at this boundary. */
  desyncAlert?: TwoWayCommunicator<ProbableWaffleDesyncAlertEvent, ProbableWaffleCommunicatorType>;
  /** Documents the pause changed member and its declared contract at this boundary. */
  pauseChanged?: TwoWayCommunicator<ProbableWafflePauseChangedEvent, ProbableWaffleCommunicatorType>;
  /** Documents the player disconnected member and its declared contract at this boundary. */
  playerDisconnected?: TwoWayCommunicator<ProbableWafflePlayerDisconnectedEvent, ProbableWaffleCommunicatorType>;
  /** Documents the player reconnected member and its declared contract at this boundary. */
  playerReconnected?: TwoWayCommunicator<ProbableWafflePlayerReconnectedEvent, ProbableWaffleCommunicatorType>;
  /** Documents the host migrated member and its declared contract at this boundary. */
  hostMigrated?: TwoWayCommunicator<ProbableWaffleHostMigratedEvent, ProbableWaffleCommunicatorType>;
  /** Documents the active socket member and its declared contract at this boundary. */
  activeSocket?: Socket;

  /**
   * operation exposed by {@link ProbableWaffleCommunicatorServiceInterface}. Its signature is the compatibility
   * boundary for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  startCommunication(gameInstanceId: GameInstanceId, socket?: Socket): void;
  /**
   * operation exposed by {@link ProbableWaffleCommunicatorServiceInterface}. Its signature is the compatibility
   * boundary for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  stopCommunication(gameInstanceId: GameInstanceId, socket?: Socket): void;
}
