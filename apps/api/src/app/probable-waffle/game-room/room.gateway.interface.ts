import { type ProbableWaffleRoomEvent } from "@fuzzy-waddle/api-interfaces";

export interface RoomGatewayInterface {
  emitRoom(roomEvent: ProbableWaffleRoomEvent): void;
  emitRoomToGameInstance(gameInstanceId: string, roomEvent: ProbableWaffleRoomEvent): void;
}
