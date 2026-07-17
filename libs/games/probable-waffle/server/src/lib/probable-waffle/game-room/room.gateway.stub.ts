import { type ProbableWaffleRoomEvent } from "@fuzzy-waddle/api-interfaces";
import { type RoomGatewayInterface } from "./room.gateway.interface";

export const roomGatewayStub = {
  emitRoom(roomEvent: ProbableWaffleRoomEvent): void {
    //
  },
  emitRoomToGameInstance(gameInstanceId: string, roomEvent: ProbableWaffleRoomEvent): void {
    //
  }
} satisfies RoomGatewayInterface;
