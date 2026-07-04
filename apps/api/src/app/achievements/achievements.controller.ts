import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import type { AuthUser } from "@supabase/supabase-js";
import { CurrentUser } from "../../auth/current-user";
import { OnlineAccessGuard } from "../../auth/guards/online-access.guard";
import { AchievementsService, type AchievementUnlockDto } from "./achievements.service";
import { UnlockAchievementDto } from "./achievement.dto";

@Controller("achievements")
@UseGuards(OnlineAccessGuard)
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get("unlocks")
  async getUnlocks(@CurrentUser() user: AuthUser, @Query("userId") userId?: string): Promise<AchievementUnlockDto[]> {
    return this.achievementsService.getUnlocks(user, userId);
  }

  @Post("unlock")
  async unlock(@CurrentUser() user: AuthUser, @Body() body: UnlockAchievementDto): Promise<void> {
    return this.achievementsService.unlock(user, body.achievementId, body.metadata);
  }
}
