import { ProbableWaffleRoomEvent, ProbableWaffleSpectatorEvent } from "@fuzzy-waddle/api-interfaces";

export interface GameInstanceGatewayInterface {
  emitRoom(roomEvent: ProbableWaffleRoomEvent);

  emitSpectator(spectatorEvent: ProbableWaffleSpectatorEvent);
}
