import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { SupabaseAuthGuard } from "../../auth/guards/supabase-auth.guard";
import { CurrentUser } from "../../auth/current-user";
import { AuthUser } from "@supabase/supabase-js";
import { ScoreDto } from "@fuzzy-waddle/api-interfaces";
import { FlySquasherService } from "./fly-squasher.service";
import { inject } from "@angular/core";

@Controller("fly-squasher")
export class FlySquasherController {
  private readonly flySquasherService = inject(FlySquasherService);

  @Post("post-score")
  @UseGuards(SupabaseAuthGuard)
  async startGame(@CurrentUser() user: AuthUser, @Body() body: ScoreDto): Promise<void> {
    await this.flySquasherService.postScore(body, user);
  }

  @Get("get-scores")
  async getScores(): Promise<ScoreDto[]> {
    return await this.flySquasherService.getScores();
  }
}
