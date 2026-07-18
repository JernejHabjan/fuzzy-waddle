import { type User } from "@supabase/supabase-js";
import {
  type ProbableWaffleCommunicatorEventUnion,
  ProbableWaffleGameInstance,
  type ProbableWaffleGetRoomsDto,
  type ProbableWaffleRoom
} from "@fuzzy-waddle/probable-waffle-protocol";
import { type RoomAction } from "@fuzzy-waddle/platform-game-sessions";
import { type RoomServerServiceInterface } from "./room-server.service.interface";

export const roomServerServiceStub = {
  getVisibleRooms(user: User, body: ProbableWaffleGetRoomsDto): Promise<ProbableWaffleRoom[]> {
    return Promise.resolve([]);
  },
  roomEvent(type: RoomAction, gameInstance: ProbableWaffleGameInstance, user: User | null): void {
    //
  },
  emitCertainGameInstanceEventsToAllUsers(body: ProbableWaffleCommunicatorEventUnion, user: User): void {
    //
  }
} satisfies RoomServerServiceInterface;
