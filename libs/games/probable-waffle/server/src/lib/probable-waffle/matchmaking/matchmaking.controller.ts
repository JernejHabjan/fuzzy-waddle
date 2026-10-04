import { Body, Controller, Delete, Post, UseGuards } from "@nestjs/common";
import { OnlineAccessGuard } from "@fuzzy-waddle/platform-identity/server/auth/guards/online-access.guard";
import { CurrentUser } from "@fuzzy-waddle/platform-identity/server/auth/current-user";
import { type AuthUser } from "@supabase/supabase-js";
import { type RequestGameSearchForMatchMakingDto } from "@fuzzy-waddle/probable-waffle-protocol";
import { MatchmakingService } from "./matchmaking.service";

@Controller("probable-waffle/matchmaking")
export class MatchmakingController {
  constructor(private readonly matchmakingService: MatchmakingService) {}

  @Post("request-game-search-for-matchmaking")
  @UseGuards(OnlineAccessGuard)
  async requestGameSearchForMatchmaking(
    @CurrentUser() user: AuthUser,
    @Body() body: RequestGameSearchForMatchMakingDto
  ): Promise<void> {
    await this.matchmakingService.requestGameSearchForMatchMaking(body, user);
  }

  @Delete("stop-request-game-search-for-matchmaking")
  @UseGuards(OnlineAccessGuard)
  async stopRequestGameSearchForMatchmaking(@CurrentUser() user: AuthUser): Promise<void> {
    await this.matchmakingService.stopRequestGameSearchForMatchmaking(user);
  }
}
