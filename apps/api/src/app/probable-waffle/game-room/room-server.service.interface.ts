import { User } from "@supabase/supabase-js";
import {
  CommunicatorEvent,
  ProbableWaffleCommunicatorType,
  ProbableWaffleGameInstance,
  ProbableWaffleGetRoomsDto,
  ProbableWaffleRoom,
  RoomAction
} from "@fuzzy-waddle/api-interfaces";

export interface RoomServerServiceInterface {
  getVisibleRooms(user: User, body: ProbableWaffleGetRoomsDto): Promise<ProbableWaffleRoom[]>;
  roomEvent(type: RoomAction, gameInstance: ProbableWaffleGameInstance, user: User | null): void;
  emitCertainGameInstanceEventsToAllUsers(
    body: CommunicatorEvent<any, ProbableWaffleCommunicatorType>,
    user: User
  ): void;
}
