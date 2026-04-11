import { TwoWayCommunicator } from "../../shared/game/communicators/two-way-communicator";
import {
  type GameInstanceId,
  type ProbableWaffleCommunicatorMessageEvent,
  type ProbableWaffleCommunicatorType,
  type ProbableWaffleGameCommandEvent,
  type ProbableWaffleGameInstanceMetadataChangeEvent,
  type ProbableWaffleGameModeDataChangeEvent,
  type ProbableWaffleGameStateDataChangeEvent,
  type ProbableWafflePlayerDataChangeEvent,
  type ProbableWaffleSpectatorDataChangeEvent,
  type ProbableWaffleStateHashEvent,
  type ProbableWaffleSnapshotRequestEvent,
  type ProbableWaffleSnapshotResponseEvent
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
  /** Active socket for reconnect handling; undefined in single-player. */
  activeSocket?: Socket;

  startCommunication(gameInstanceId: GameInstanceId, socket: Socket): void;
  stopCommunication(gameInstanceId: GameInstanceId, socket: Socket): void;
}
