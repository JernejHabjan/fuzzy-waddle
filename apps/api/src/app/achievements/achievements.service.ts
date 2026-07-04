import { Injectable } from "@nestjs/common";
import type { AuthUser } from "@supabase/supabase-js";
import { POSTGRES_ERROR_CODES } from "../../core/database/postgres-error-codes";
import { SupabaseProviderService } from "../../core/supabase-provider/supabase-provider.service";
import { Json } from "@fuzzy-waddle/api-interfaces";

export interface AchievementUnlockDto {
  id: number;
  achievement_id: string;
  user_id: string;
  unlocked_at: string;
  metadata: unknown;
}

@Injectable()
export class AchievementsService {
  constructor(private readonly supabaseProviderService: SupabaseProviderService) {}

  async getUnlocks(user: AuthUser, targetUserId?: string): Promise<AchievementUnlockDto[]> {
    const userId = targetUserId || user.id;
    const { data, error } = await this.supabaseProviderService.supabaseClient
      .from("user_achievement_unlocks")
      .select("id, achievement_id, user_id, unlocked_at, metadata")
      .eq("user_id", userId);

    if (error) {
      console.error(error);
      throw error;
    }

    return data || [];
  }

  async unlock(user: AuthUser, achievementId: string, metadata?: Record<string, unknown>): Promise<void> {
    const { error } = await this.supabaseProviderService.supabaseClient.from("user_achievement_unlocks").insert({
      achievement_id: achievementId,
      user_id: user.id,
      metadata: (metadata || {}) as unknown as Json
    });

    if (error?.code === POSTGRES_ERROR_CODES.UNIQUENESS_VIOLATION) {
      return;
    }

    if (error) {
      console.error(error);
      throw error;
    }
  }
}
