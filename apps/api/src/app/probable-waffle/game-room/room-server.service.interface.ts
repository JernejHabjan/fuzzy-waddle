import { type User } from "@supabase/supabase-js";
import {
  type CommunicatorEvent,
  type ProbableWaffleCommunicatorType,
  ProbableWaffleGameInstance,
  type ProbableWaffleGetRoomsDto,
  type ProbableWaffleRoom,
  type RoomAction
} from "@fuzzy-waddle/api-interfaces";

export interface RoomServerServiceInterface {
  getVisibleRooms(user: User, body: ProbableWaffleGetRoomsDto): Promise<ProbableWaffleRoom[]>;
  roomEvent(type: RoomAction, gameInstance: ProbableWaffleGameInstance, user: User | null): void;
  emitCertainGameInstanceEventsToAllUsers(
    body: CommunicatorEvent<any, ProbableWaffleCommunicatorType>,
    user: User
  ): void;
}
