import {
  ProbableWaffleLevelStateChangeEvent,
  ProbableWafflePlayerEvent,
  ProbableWaffleRoomEvent,
  ProbableWaffleSpectatorEvent
} from "@fuzzy-waddle/api-interfaces";

export interface GameInstanceGatewayInterface {
  emitRoom(roomEvent: ProbableWaffleRoomEvent);

  emitLevelStateChange(levelStateChange: ProbableWaffleLevelStateChangeEvent);
  emitSpectator(spectatorEvent: ProbableWaffleSpectatorEvent);

  emitPlayer(playerEvent: ProbableWafflePlayerEvent);
}
