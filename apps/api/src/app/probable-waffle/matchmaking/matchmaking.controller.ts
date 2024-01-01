import { Body, Controller, Delete, Post, UseGuards } from "@nestjs/common";
import { SupabaseAuthGuard } from "../../../auth/guards/supabase-auth.guard";
import { CurrentUser } from "../../../auth/current-user";
import { AuthUser } from "@supabase/supabase-js";
import { RequestGameSearchForMatchMakingDto } from "@fuzzy-waddle/api-interfaces";
import { MatchmakingService } from "./matchmaking.service";

@Controller("probable-waffle/matchmaking")
export class MatchmakingController {
  constructor(private readonly matchmakingService: MatchmakingService) {}

  @Post("request-game-search-for-matchmaking")
  @UseGuards(SupabaseAuthGuard)
  async requestGameSearchForMatchmaking(
    @CurrentUser() user: AuthUser,
    @Body() body: RequestGameSearchForMatchMakingDto
  ): Promise<void> {
    await this.matchmakingService.requestGameSearchForMatchMaking(body, user);
  }

  @Delete("stop-request-game-search-for-matchmaking")
  @UseGuards(SupabaseAuthGuard)
  async stopRequestGameSearchForMatchmaking(@CurrentUser() user: AuthUser): Promise<void> {
    await this.matchmakingService.stopRequestGameSearchForMatchmaking(user);
  }
}
