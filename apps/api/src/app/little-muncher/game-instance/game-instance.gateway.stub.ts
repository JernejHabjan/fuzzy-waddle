import type { GameInstanceGatewayInterface } from "./game-instance.gateway.interface";
import { LittleMuncherRoomEvent, LittleMuncherSpectatorEvent } from "@fuzzy-waddle/api-interfaces";

export const GameInstanceGatewayStub = {
  emitRoom(roomEvent: LittleMuncherRoomEvent) {
    //
  },
  emitSpectator(spectatorEvent: LittleMuncherSpectatorEvent) {
    //
  }
} satisfies GameInstanceGatewayInterface;
