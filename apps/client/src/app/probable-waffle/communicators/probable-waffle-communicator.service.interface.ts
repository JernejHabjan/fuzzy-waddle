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
  type ProbableWaffleSpectatorDataChangeEvent
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

  startCommunication(gameInstanceId: GameInstanceId, socket: Socket): void;
  stopCommunication(gameInstanceId: GameInstanceId, socket: Socket): void;
}
