import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { SupabaseAuthGuard } from "../../../auth/guards/supabase-auth.guard";
import { CurrentUser } from "../../../auth/current-user";
import { type AuthUser } from "@supabase/supabase-js";
import { GameInstanceService } from "./game-instance.service";
import {
  type ProbableWaffleGameInstanceData,
  type ProbableWaffleGameInstanceMetadataData
} from "@fuzzy-waddle/api-interfaces";

@Controller("probable-waffle")
export class GameInstanceController {
  constructor(private readonly gameInstanceService: GameInstanceService) {}
  @Post("start-game")
  @UseGuards(SupabaseAuthGuard)
  async startGame(@CurrentUser() user: AuthUser, @Body() body: ProbableWaffleGameInstanceMetadataData): Promise<void> {
    await this.gameInstanceService.createGameInstance(body, user);
  }

  @Get("get-game-instance")
  @UseGuards(SupabaseAuthGuard)
  async getGameInstance(
    @CurrentUser() user: AuthUser,
    @Query("gameInstanceId") gameInstanceId: string
  ): Promise<ProbableWaffleGameInstanceData | null> {
    return this.gameInstanceService.getGameInstanceData(gameInstanceId);
  }
}
