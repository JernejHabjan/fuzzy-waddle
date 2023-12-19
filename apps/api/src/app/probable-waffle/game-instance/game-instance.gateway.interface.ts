import { RoomEvent, SpectatorEvent } from "@fuzzy-waddle/api-interfaces";

export interface GameInstanceGatewayInterface {
  emitRoom(roomEvent: RoomEvent);

  emitSpectator(spectatorEvent: SpectatorEvent);
}
