import { Body, Controller, Delete, Get, Post, UseGuards } from "@nestjs/common";
import { SupabaseAuthGuard } from "../../../auth/guards/supabase-auth.guard";
import { CurrentUser } from "../../../auth/current-user";
import { AuthUser } from "@supabase/supabase-js";
import { GameInstanceService } from "./game-instance.service";
import {
  GameInstanceDataDto,
  ProbableWaffleStartLevelDto,
  ProbableWaffleGameInstanceData,
  ProbableWaffleRoom,
  ProbableWaffleGameInstanceDataDto,
  ProbableWaffleJoinDto
} from "@fuzzy-waddle/api-interfaces";

@Controller("probable-waffle")
export class GameInstanceController {
  constructor(private readonly gameInstanceService: GameInstanceService) {}

  @Post("start-game")
  @UseGuards(SupabaseAuthGuard)
  async startGame(@CurrentUser() user: AuthUser, @Body() body: ProbableWaffleGameInstanceDataDto): Promise<void> {
    await this.gameInstanceService.startGame(body, user);
  }

  @Delete("stop-game")
  @UseGuards(SupabaseAuthGuard)
  async stopGame(@CurrentUser() user: AuthUser, @Body() body: GameInstanceDataDto): Promise<void> {
    await this.gameInstanceService.stopGame(body, user);
  }

  @Post("start-level")
  @UseGuards(SupabaseAuthGuard)
  async startLevel(@CurrentUser() user: AuthUser, @Body() body: ProbableWaffleStartLevelDto): Promise<void> {
    await this.gameInstanceService.startLevel(body, user);
  }

  @Delete("stop-level")
  @UseGuards(SupabaseAuthGuard)
  async stopLevel(@CurrentUser() user: AuthUser, @Body() body: GameInstanceDataDto): Promise<void> {
    await this.gameInstanceService.stopLevel(body, user);
  }

  @Post("join-room")
  @UseGuards(SupabaseAuthGuard)
  async joinRoom(
    @CurrentUser() user: AuthUser,
    @Body() body: ProbableWaffleJoinDto
  ): Promise<ProbableWaffleGameInstanceData> {
    return await this.gameInstanceService.joinRoom(body, user);
  }

  @Delete("leave-room")
  @UseGuards(SupabaseAuthGuard)
  async leaveRoom(@CurrentUser() user: AuthUser, @Body() body: GameInstanceDataDto): Promise<void> {
    await this.gameInstanceService.leaveRoom(body, user);
  }

  @Get("get-rooms")
  @UseGuards(SupabaseAuthGuard)
  async getRooms(@CurrentUser() user: AuthUser): Promise<ProbableWaffleRoom[]> {
    return await this.gameInstanceService.getJoinableRooms(user);
  }
}
