import { LittleMuncherRoomEvent, LittleMuncherSpectatorEvent } from "@fuzzy-waddle/api-interfaces";

export interface GameInstanceGatewayInterface {
  emitRoom(roomEvent: LittleMuncherRoomEvent);

  emitSpectator(spectatorEvent: LittleMuncherSpectatorEvent);
}
