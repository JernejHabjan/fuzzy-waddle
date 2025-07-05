import { User } from "@supabase/supabase-js";
import {
  CommunicatorEvent,
  ProbableWaffleCommunicatorType,
  ProbableWaffleGameInstance,
  ProbableWaffleGetRoomsDto,
  ProbableWaffleRoom,
  RoomAction
} from "@fuzzy-waddle/api-interfaces";
import { RoomServerServiceInterface } from "./room-server.service.interface";

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
