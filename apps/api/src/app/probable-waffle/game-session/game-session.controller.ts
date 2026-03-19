import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { SupabaseAuthGuard } from "../../../auth/guards/supabase-auth.guard";
import { CurrentUser } from "../../../auth/current-user";
import type { AuthUser } from "@supabase/supabase-js";
import { GameSessionService } from "./game-session.service";
import { MatchHistoryQueryDto } from "./match-history.dto";
import { SubmitScoresDto } from "./submit-scores.dto";

@Controller("probable-waffle/game-session")
export class GameSessionController {
  constructor(private readonly gameSessionService: GameSessionService) {}

  /**
   * Submit scores for a completed game
   * Idempotent - safe to call multiple times
   */
  @Post("submit-scores")
  @UseGuards(SupabaseAuthGuard)
  async submitScores(@CurrentUser() user: AuthUser, @Body() dto: SubmitScoresDto) {
    return this.gameSessionService.submitScores(
      dto.gameInstanceId,
      dto.playerScores,
      user.id,
      {
        gameType: dto.gameType,
        mapId: dto.mapId,
        humanPlayerCount: dto.humanPlayerCount
      },
      dto.snapshots
    );
  }

  /**
   * Get match history for current user
   * Paginated results
   */
  @Get("match-history")
  @UseGuards(SupabaseAuthGuard)
  async getMatchHistory(@CurrentUser() user: AuthUser, @Query() query: MatchHistoryQueryDto) {
    return this.gameSessionService.getMatchHistory(user.id, query.limit, query.offset);
  }

  /**
   * Get detailed scores for a specific match
   * Verifies user participated in the game
   */
  @Get(":gameInstanceId/details")
  @UseGuards(SupabaseAuthGuard)
  async getMatchDetails(@CurrentUser() user: AuthUser, @Param("gameInstanceId") gameInstanceId: string) {
    return this.gameSessionService.getMatchDetails(gameInstanceId, user.id);
  }
}
