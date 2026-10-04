import type { GameInstanceGatewayInterface } from "./game-instance.gateway.interface";
import type { LittleMuncherRoomEvent, LittleMuncherSpectatorEvent } from "@fuzzy-waddle/little-muncher-protocol";

export const GameInstanceGatewayStub = {
  emitRoom(roomEvent: LittleMuncherRoomEvent) {
    //
  },
  emitSpectator(spectatorEvent: LittleMuncherSpectatorEvent) {
    //
  }
} satisfies GameInstanceGatewayInterface;
