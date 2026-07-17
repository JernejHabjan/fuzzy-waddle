import { type LittleMuncherRoomEvent, type LittleMuncherSpectatorEvent } from "@fuzzy-waddle/little-muncher-protocol";

export interface GameInstanceGatewayInterface {
  emitRoom(roomEvent: LittleMuncherRoomEvent): void;
  emitSpectator(spectatorEvent: LittleMuncherSpectatorEvent): void;
}
