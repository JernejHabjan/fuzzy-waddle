import { type RequestGameSearchForMatchMakingDto } from "@fuzzy-waddle/api-interfaces";
import { type User } from "@supabase/supabase-js";

export interface MatchmakingServiceInterface {
  requestGameSearchForMatchMaking(body: RequestGameSearchForMatchMakingDto, user: User): Promise<void>;
  stopRequestGameSearchForMatchmaking(user: User): Promise<void>;
}
