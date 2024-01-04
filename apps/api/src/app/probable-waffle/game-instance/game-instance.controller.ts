import { Body, Controller, Delete, Get, Post, Put, Query, UseGuards } from "@nestjs/common";
import { SupabaseAuthGuard } from "../../../auth/guards/supabase-auth.guard";
import { CurrentUser } from "../../../auth/current-user";
import { AuthUser } from "@supabase/supabase-js";
import { GameInstanceService } from "./game-instance.service";
import {
  GameInstanceDataDto,
  ProbableWaffleAddPlayerDto,
  ProbableWaffleAddSpectatorDto,
  ProbableWaffleChangeGameModeDto,
  ProbableWaffleGameInstanceData,
  ProbableWaffleGameInstanceMetadataData,
  ProbableWafflePlayerLeftDto,
  ProbableWaffleStartLevelDto
} from "@fuzzy-waddle/api-interfaces";

@Controller("probable-waffle")
export class GameInstanceController {
  constructor(private readonly gameInstanceService: GameInstanceService) {}
  @Post("start-game")
  @UseGuards(SupabaseAuthGuard)
  async startGame(@CurrentUser() user: AuthUser, @Body() body: ProbableWaffleGameInstanceMetadataData): Promise<void> {
    await this.gameInstanceService.createGameInstance(body, user);
  }

  @Post("start-level") // TODO REMOVE THIS
  @UseGuards(SupabaseAuthGuard)
  async startLevel(@CurrentUser() user: AuthUser, @Body() body: ProbableWaffleStartLevelDto): Promise<void> {
    await this.gameInstanceService.startLevel(body, user);
  }

  @Delete("leave-room") // todo remove this
  @UseGuards(SupabaseAuthGuard)
  async leaveRoom(@CurrentUser() user: AuthUser, @Body() body: GameInstanceDataDto): Promise<void> {
    await this.gameInstanceService.leaveRoom(body, user);
  }

  @Get("get-game-instance")
  @UseGuards(SupabaseAuthGuard)
  async getGameInstance(
    @CurrentUser() user: AuthUser,
    @Query("gameInstanceId") gameInstanceId: string
  ): Promise<ProbableWaffleGameInstanceData | null> {
    return await this.gameInstanceService.getGameInstance(gameInstanceId, user);
  }

  @Put("change-game-mode") // TODO REMOVE
  @UseGuards(SupabaseAuthGuard)
  async changeGameMode(@CurrentUser() user: AuthUser, @Body() body: ProbableWaffleChangeGameModeDto): Promise<void> {
    await this.gameInstanceService.changeGameMode(user, body);
  }

  @Post("open-player-slot") // TODO REMOVE
  @UseGuards(SupabaseAuthGuard)
  async openPlayerSlot(@CurrentUser() user: AuthUser, @Body() body: ProbableWaffleAddPlayerDto): Promise<void> {
    await this.gameInstanceService.openPlayerSlot(body, user);
  }

  @Post("player-left") // todo remove
  @UseGuards(SupabaseAuthGuard)
  async playerLeft(@CurrentUser() user: AuthUser, @Body() body: ProbableWafflePlayerLeftDto): Promise<void> {
    await this.gameInstanceService.playerLeft(body, user);
  }

  @Post("add-player") // todo remove
  @UseGuards(SupabaseAuthGuard)
  async addPlayer(@CurrentUser() user: AuthUser, @Body() body: ProbableWaffleAddPlayerDto): Promise<void> {
    await this.gameInstanceService.addPlayer(body, user);
  }

  @Post("add-spectator") // todo remove
  @UseGuards(SupabaseAuthGuard)
  async addSpectator(@CurrentUser() user: AuthUser, @Body() body: ProbableWaffleAddSpectatorDto): Promise<void> {
    await this.gameInstanceService.addSpectator(body, user);
  }
}
