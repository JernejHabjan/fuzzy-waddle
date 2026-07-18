import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { OnlineAccessGuard } from "@fuzzy-waddle/platform-identity/server/auth/guards/online-access.guard";
import { CurrentUser } from "@fuzzy-waddle/platform-identity/server/auth/current-user";
import { type AuthUser } from "@supabase/supabase-js";
import { GameInstanceService } from "./game-instance.service";
import type { GameInstanceId } from "@fuzzy-waddle/platform-game-sessions";
import {
  type ProbableWaffleGameInstanceData,
  type ProbableWaffleGameInstanceMetadataData
} from "@fuzzy-waddle/probable-waffle-protocol";

@Controller("probable-waffle")
export class GameInstanceController {
  constructor(private readonly gameInstanceService: GameInstanceService) {}
  @Post("start-game")
  @UseGuards(OnlineAccessGuard)
  async startGame(@CurrentUser() user: AuthUser, @Body() body: ProbableWaffleGameInstanceMetadataData): Promise<void> {
    await this.gameInstanceService.createGameInstance(body, user);
  }

  @Get("get-game-instance")
  @UseGuards(OnlineAccessGuard)
  async getGameInstance(
    @CurrentUser() user: AuthUser,
    @Query("gameInstanceId") gameInstanceId: GameInstanceId
  ): Promise<ProbableWaffleGameInstanceData | null> {
    return this.gameInstanceService.getGameInstanceDataForUser(gameInstanceId, user);
  }
}
