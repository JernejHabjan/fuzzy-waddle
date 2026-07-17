import { type User } from "@supabase/supabase-js";
import { type ProbableWaffleCommunicatorEventUnion, ProbableWaffleGameInstance, type ProbableWaffleGetRoomsDto, type ProbableWaffleRoom } from "@fuzzy-waddle/probable-waffle-protocol";
import { type RoomAction } from "@fuzzy-waddle/platform-game-sessions";

export interface RoomServerServiceInterface {
  getVisibleRooms(user: User, body: ProbableWaffleGetRoomsDto): Promise<ProbableWaffleRoom[]>;
  roomEvent(type: RoomAction, gameInstance: ProbableWaffleGameInstance, user: User | null): void;
  emitCertainGameInstanceEventsToAllUsers(body: ProbableWaffleCommunicatorEventUnion, user: User): void;
}
