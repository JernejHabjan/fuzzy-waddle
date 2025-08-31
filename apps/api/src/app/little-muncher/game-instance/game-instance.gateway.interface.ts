import { type LittleMuncherRoomEvent, type LittleMuncherSpectatorEvent } from "@fuzzy-waddle/api-interfaces";

export interface GameInstanceGatewayInterface {
  emitRoom(roomEvent: LittleMuncherRoomEvent): void;
  emitSpectator(spectatorEvent: LittleMuncherSpectatorEvent): void;
}
