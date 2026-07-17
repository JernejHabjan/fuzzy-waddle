import { type RequestGameSearchForMatchMakingDto } from "@fuzzy-waddle/api-interfaces";
import { type User } from "@supabase/supabase-js";
import { type MatchmakingServiceInterface } from "./matchmaking.service.interface";

export const matchmakingServiceStub = {
  async requestGameSearchForMatchMaking(body: RequestGameSearchForMatchMakingDto, user: User): Promise<void> {
    return Promise.resolve();
  },
  async stopRequestGameSearchForMatchmaking(user: User): Promise<void> {
    return Promise.resolve();
  }
} satisfies MatchmakingServiceInterface;
