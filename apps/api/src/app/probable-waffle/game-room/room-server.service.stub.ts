import { type User } from "@supabase/supabase-js";
import {
  type CommunicatorEvent,
  type ProbableWaffleCommunicatorType,
  ProbableWaffleGameInstance,
  type ProbableWaffleGetRoomsDto,
  type ProbableWaffleRoom,
  type RoomAction
} from "@fuzzy-waddle/api-interfaces";
import { type RoomServerServiceInterface } from "./room-server.service.interface";

export const roomServerServiceStub = {
  getVisibleRooms(user: User, body: ProbableWaffleGetRoomsDto): Promise<ProbableWaffleRoom[]> {
    return Promise.resolve([]);
  },
  roomEvent(type: RoomAction, gameInstance: ProbableWaffleGameInstance, user: User | null): void {
    //
  },
  emitCertainGameInstanceEventsToAllUsers(
    body: CommunicatorEvent<any, ProbableWaffleCommunicatorType>,
    user: User
  ): void {
    //
  }
} satisfies RoomServerServiceInterface;
