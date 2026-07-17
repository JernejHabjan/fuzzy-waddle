import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { OnlineAccessGuard } from "@fuzzy-waddle/api/auth/guards/online-access.guard";
import { CurrentUser } from "@fuzzy-waddle/api/auth/current-user";
import { type AuthUser } from "@supabase/supabase-js";
import { ScoreDto } from "@fuzzy-waddle/api-interfaces";
import { FlySquasherService } from "./fly-squasher.service";

@Controller("fly-squasher")
export class FlySquasherController {
  constructor(private readonly flySquasherService: FlySquasherService) {}

  @Post("post-score")
  @UseGuards(OnlineAccessGuard)
  async startGame(@CurrentUser() user: AuthUser, @Body() body: ScoreDto): Promise<void> {
    await this.flySquasherService.postScore(body, user);
  }

  @Get("get-scores")
  async getScores(): Promise<ScoreDto[]> {
    return await this.flySquasherService.getScores();
  }
}
