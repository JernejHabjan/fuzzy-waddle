import { RequestGameSearchForMatchMakingDto } from "@fuzzy-waddle/api-interfaces";
import { User } from "@supabase/supabase-js";
import { MatchmakingServiceInterface } from "./matchmaking.service.interface";

export const matchmakingServiceStub = {
  async requestGameSearchForMatchMaking(body: RequestGameSearchForMatchMakingDto, user: User): Promise<void> {
    return Promise.resolve();
  },
  async stopRequestGameSearchForMatchmaking(user: User): Promise<void> {
    return Promise.resolve();
  }
} satisfies MatchmakingServiceInterface;
