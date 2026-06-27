import { TwoWayCommunicator } from "../../shared/game/communicators/two-way-communicator";
import {
  type GameInstanceId,
  type ProbableWaffleCommunicatorMessageEvent,
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
} from "@fuzzy-waddle/api-interfaces";
import { Socket } from "ngx-socket-io";

export interface ProbableWaffleCommunicatorServiceInterface {
  gameInstanceMetadataChanged?: TwoWayCommunicator<
    ProbableWaffleGameInstanceMetadataChangeEvent,
    ProbableWaffleCommunicatorType
  >;
  gameModeChanged?: TwoWayCommunicator<ProbableWaffleGameModeDataChangeEvent, ProbableWaffleCommunicatorType>;
  playerChanged?: TwoWayCommunicator<ProbableWafflePlayerDataChangeEvent, ProbableWaffleCommunicatorType>;
  spectatorChanged?: TwoWayCommunicator<ProbableWaffleSpectatorDataChangeEvent, ProbableWaffleCommunicatorType>;
  gameStateChanged?: TwoWayCommunicator<ProbableWaffleGameStateDataChangeEvent, ProbableWaffleCommunicatorType>;
  message?: TwoWayCommunicator<ProbableWaffleCommunicatorMessageEvent, ProbableWaffleCommunicatorType>;
  /** Command relay communicator; only initialised in multiplayer sessions. */
  gameCommandChanged?: TwoWayCommunicator<ProbableWaffleGameCommandEvent, ProbableWaffleCommunicatorType>;
  /** Periodic state-hash exchange; only initialised in multiplayer sessions. */
  stateHashChanged?: TwoWayCommunicator<ProbableWaffleStateHashEvent, ProbableWaffleCommunicatorType>;
  /** Snapshot request (reconnecting/spectating client → host); only in MP. */
  snapshotRequested?: TwoWayCommunicator<ProbableWaffleSnapshotRequestEvent, ProbableWaffleCommunicatorType>;
  /** Snapshot response (host → requesting client); only in MP. */
  snapshotResponse?: TwoWayCommunicator<ProbableWaffleSnapshotResponseEvent, ProbableWaffleCommunicatorType>;
  /** Server-originated signal that game instance is missing and needs reseed. */
  instanceReseedRequired?: TwoWayCommunicator<
    ProbableWaffleInstanceReseedRequiredEvent,
    ProbableWaffleCommunicatorType
  >;
  /** Client-originated payload used to recreate missing server game instance. */
  instanceReseed?: TwoWayCommunicator<ProbableWaffleInstanceReseedEvent, ProbableWaffleCommunicatorType>;
  /** Host-issued unresolved desync alert; only in MP. */
  desyncAlert?: TwoWayCommunicator<ProbableWaffleDesyncAlertEvent, ProbableWaffleCommunicatorType>;
  /** Multiplayer pause/resume relay; only in MP. */
  pauseChanged?: TwoWayCommunicator<ProbableWafflePauseChangedEvent, ProbableWaffleCommunicatorType>;
  /** Server-originated disconnect notification; only in MP. */
  playerDisconnected?: TwoWayCommunicator<ProbableWafflePlayerDisconnectedEvent, ProbableWaffleCommunicatorType>;
  /** Server-originated reconnect notification; only in MP. */
  playerReconnected?: TwoWayCommunicator<ProbableWafflePlayerReconnectedEvent, ProbableWaffleCommunicatorType>;
  /** Server-originated host migration event; only in MP. */
  hostMigrated?: TwoWayCommunicator<ProbableWaffleHostMigratedEvent, ProbableWaffleCommunicatorType>;
  /** Active socket for reconnect handling; undefined in single-player. */
  activeSocket?: Socket;

  startCommunication(gameInstanceId: GameInstanceId, socket?: Socket): void;
  stopCommunication(gameInstanceId: GameInstanceId, socket?: Socket): void;
}
