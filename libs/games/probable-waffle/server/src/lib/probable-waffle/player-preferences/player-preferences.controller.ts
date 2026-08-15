import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import type { AuthUser } from "@supabase/supabase-js";
import { CurrentUser } from "@fuzzy-waddle/platform-identity/server/auth/current-user";
import { SupabaseAuthGuard } from "@fuzzy-waddle/platform-identity/server/auth/guards/supabase-auth.guard";
import type {
  ProbableWafflePlayerPreferences,
  UpdateProbableWafflePlayerPreferencesDto
} from "@fuzzy-waddle/probable-waffle-protocol";
import { PlayerPreferencesService } from "./player-preferences.service";

/** Authenticated API for loading and synchronizing personal game preferences. */
@Controller("probable-waffle/preferences")
@UseGuards(SupabaseAuthGuard)
export class PlayerPreferencesController {
  constructor(private readonly playerPreferencesService: PlayerPreferencesService) {}

  @Get()
  get(@CurrentUser() user: AuthUser): Promise<ProbableWafflePlayerPreferences | null> {
    return this.playerPreferencesService.get(user.id);
  }

  @Put()
  save(
    @CurrentUser() user: AuthUser,
    @Body() body: UpdateProbableWafflePlayerPreferencesDto
  ): Promise<ProbableWafflePlayerPreferences> {
    return this.playerPreferencesService.save(user.id, body.preferences);
  }
}
