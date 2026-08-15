import { BadRequestException, Injectable } from "@nestjs/common";
import {
  isProbableWafflePlayerPreferences,
  type ProbableWafflePlayerPreferences
} from "@fuzzy-waddle/probable-waffle-protocol";
import { SupabaseProviderService } from "@fuzzy-waddle/platform-database-schema/server/supabase-provider/supabase-provider.service";
import type { PlayerPreferencesServiceInterface } from "./player-preferences.service.interface";

/** Stores one versioned preference document on the authenticated user's profile. */
@Injectable()
export class PlayerPreferencesService implements PlayerPreferencesServiceInterface {
  constructor(private readonly supabaseProviderService: SupabaseProviderService) {}

  async get(userId: string): Promise<ProbableWafflePlayerPreferences | null> {
    const { data, error } = await this.supabaseProviderService.supabaseClient
      .from("user_profiles")
      .select("probable_waffle_preferences")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    const stored = data?.probable_waffle_preferences;
    return isProbableWafflePlayerPreferences(stored) ? stored : null;
  }

  async save(userId: string, preferences: ProbableWafflePlayerPreferences): Promise<ProbableWafflePlayerPreferences> {
    if (!isProbableWafflePlayerPreferences(preferences)) {
      throw new BadRequestException("Invalid Probable Waffle preferences");
    }
    const persistedPreferences = { ...preferences } satisfies ProbableWafflePlayerPreferences;
    const { error } = await this.supabaseProviderService.supabaseClient
      .from("user_profiles")
      .update({ probable_waffle_preferences: persistedPreferences })
      .eq("id", userId);
    if (error) throw error;
    return preferences;
  }
}
