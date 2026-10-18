import { ForbiddenException, Injectable } from "@nestjs/common";
import type { AuthUser } from "@supabase/supabase-js";

type GameChatAccessGuard = (gameInstanceId: string, user: AuthUser) => void;

@Injectable()
export class GameChatAccessRegistry {
  private guard?: GameChatAccessGuard;

  register(guard: GameChatAccessGuard): void {
    this.guard = guard;
  }

  ensureCanAccess(gameInstanceId: string, user: AuthUser): void {
    if (!this.guard) {
      throw new ForbiddenException("Game chat is unavailable");
    }
    this.guard(gameInstanceId, user);
  }
}
