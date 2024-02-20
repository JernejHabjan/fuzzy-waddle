import { TwoWayCommunicator } from "../../shared/game/communicators/two-way-communicator";
import {
  ProbableWaffleCommunicatorMessageEvent,
  ProbableWaffleCommunicatorType,
  ProbableWaffleGameInstanceMetadataChangeEvent,
  ProbableWaffleGameModeDataChangeEvent,
  ProbableWafflePlayerDataChangeEvent,
  ProbableWaffleSpectatorDataChangeEvent
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
  message?: TwoWayCommunicator<ProbableWaffleCommunicatorMessageEvent, ProbableWaffleCommunicatorType>;

  startCommunication(gameInstanceId: string, socket: Socket): void;
  stopCommunication(gameInstanceId: string, socket: Socket): void;
}
