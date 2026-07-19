import { type ProbableWaffleRoomEvent } from "@fuzzy-waddle/probable-waffle-protocol";

export interface RoomGatewayInterface {
  emitRoom(roomEvent: ProbableWaffleRoomEvent): void;
  emitRoomToGameInstance(gameInstanceId: string, roomEvent: ProbableWaffleRoomEvent): void;
}
